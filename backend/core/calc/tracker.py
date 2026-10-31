"""The customer-facing view of a project: ten friendly steps, mapped from Project.stage."""
from .. import config
from ..models import Project, Task
from ..money import inr

STEPS = ["Enquiry received", "Eligibility check", "Site survey", "Quote ready", "Order confirmed", "On the way",
         "Delivered", "Installed", "Paperwork", "Warranty active"]


def current_index(project) -> int:
    s = project.stage
    if s == Project.Stage.LOST:
        return -1
    if s == Project.Stage.INSTALLED:
        return 7 if project.balance_due_paise > 0 else 8
    return {"enquiry": 0, "qualified": 1, "survey": 2, "quoting": 2, "quoted": 3, "accepted": 3, "ordered": 4,
            "dispatched": 5, "delivered": 6, "completed": 9}[s]


def customer_tracker(project) -> dict:
    idx = current_index(project)
    s = project.stage
    cta = None
    nxt = ""
    if s == "enquiry":
        nxt = f"We'll call you within {config.get('first_call_minutes')} minutes to check a few basics."
    elif s == "qualified":
        sv = project.survey
        if sv and sv.scheduled_for:
            nxt = f"Site survey on {sv.scheduled_for:%A %d %b}. Please confirm the date below."
        else:
            nxt = "We are planning your site survey."
    elif s == "survey":
        nxt = "Your survey is done. Our engineer is reviewing it."
    elif s == "quoting":
        nxt = "Survey approved. We are preparing your quote."
    elif s == "quoted":
        nxt, cta = "Your quote is ready. Review it and accept to go ahead.", ("Review your quote", f"/portal/p/{project.id}/quote/")
    elif s == "accepted":
        due = max(project.advance_required_paise - project.confirmed_paid_paise, 0)
        nxt, cta = f"Pay the advance of {inr(due)} to confirm your order.", (f"Pay {inr(due)}", f"/portal/p/{project.id}/pay/")
        if project.payments.filter(status="pending").exists():
            nxt, cta = "We are verifying your payment reference. Your order is confirmed as soon as it matches.", None
    elif s == "ordered":
        job = getattr(project, "job", None)
        nxt = (f"Installation planned for {job.scheduled_date:%A %d %b}." if job and job.scheduled_date
               else "Your equipment is being prepared.")
    elif s == "dispatched":
        nxt = "Your equipment is on its way."
    elif s == "delivered":
        nxt = "Your equipment has arrived. Installation is next."
    elif s == "installed":
        bal = project.balance_due_paise
        if bal > 0:
            nxt, cta = f"Installation complete. Please pay the balance of {inr(bal)}.", (f"Pay {inr(bal)}", f"/portal/p/{project.id}/pay/")
        else:
            subs = project.tasks.filter(kind="subsidy")
            if subs.exists():
                done = subs.filter(status__in=[Task.Status.DONE, Task.Status.NA]).count()
                nxt = f"Subsidy paperwork: {done} of {subs.count()} steps done."
            else:
                nxt = "Installation complete."
    elif s == "completed":
        nxt = "All done. Your warranty is active; see My systems for the dates."
    elif s == "lost":
        nxt = "This enquiry is closed. You can send a new one any time."
    steps = []
    for i, label in enumerate(STEPS):
        state = "done" if (idx == 9 or i < idx) else ("current" if i == idx else "todo")
        steps.append({"n": i + 1, "label": label, "state": state, "note": nxt if i == idx else ""})
    return {"steps": steps, "index": idx, "label": STEPS[idx] if idx >= 0 else "Closed", "next": nxt, "cta": cta}
