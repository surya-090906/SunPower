"""T8 payment -> order confirmation, with install scheduling and the subsidy checklist."""
from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction

from .. import clock, config
from ..calc import stock
from ..calc.finance import crew_size
from ..calc.schedule import pick_technicians
from ..models import (Dispatch, DispatchLine, InstallJob, JobAssignment, Payment, Project, Task)
from ..money import inr
from .common import (RuleError, add_task, close_tasks, log, message_customer, notify, notify_customer,
                     require_role, set_stage, users_with_role)

SUBSIDY_STEPS = [
    "Application registered on the national portal",
    "DISCOM feasibility approved",
    "Installation details uploaded",
    "Net meter installed and inspected",
    "Commissioning certificate issued",
    "Subsidy credited to the customer's bank account",
]


@dataclass
class PaymentResult:
    payment: Payment
    order_confirmed: bool = False
    shortfall_paise: int = 0
    message: str = ""


def schedule_install(project, awaiting_stock=False):
    """Auto-schedule the install: earliest day with a free crew (blueprint section 5.5)."""
    wait = config.get("lead_time_days") + (config.get("stock_wait_days") if awaiting_stock else 0)
    day, techs = pick_technicians(clock.today() + timedelta(days=wait), crew_size(project.requested_kw), "install")
    job = InstallJob.objects.create(project=project, scheduled_date=day)
    for i, t in enumerate(techs):
        JobAssignment.objects.create(job=job, technician=t, role="lead" if i == 0 else "helper")
    return job


def _create_subsidy_tasks(project):
    for i, title in enumerate(SUBSIDY_STEPS, start=1):
        early = i <= 2   # steps 3+ wait for the installation
        add_task(project, "subsidy", title, "accounts", seq=i, due_in=timedelta(days=3 if i == 1 else 14) if early else None,
                 status=Task.Status.OPEN if early else Task.Status.BLOCKED)


def _confirm_order(project, actor=None):
    quote = project.accepted_quote
    set_stage(project, Project.Stage.ORDERED)
    project.ordered_at = clock.now()
    project.save(update_fields=["ordered_at"])
    close_tasks(project, "collect_advance")

    dispatch = Dispatch.objects.create(project=project, status=Dispatch.Status.TO_PICK)
    needed = {}
    for line in quote.lines.select_related("product"):
        if line.product and not line.product.is_service:
            needed[line.product] = needed.get(line.product, 0) + line.qty
    for product, qty in needed.items():
        DispatchLine.objects.create(dispatch=dispatch, product=product, qty_required=qty)
    short = [dl for dl in dispatch.lines.select_related("product") if stock.available(dl.product, exclude_dispatch=dispatch) < dl.qty_required]
    if short:
        dispatch.status = Dispatch.Status.AWAITING_STOCK
        dispatch.save(update_fields=["status"])

    job = None if project.kind == Project.Kind.PANELSET else schedule_install(project, awaiting_stock=bool(short))
    if project.wants_subsidy:
        _create_subsidy_tasks(project)

    crew = ", ".join(a.technician.display_name for a in job.assignments.select_related("technician")) if job else ""
    if job:
        plan = f"install scheduled for {job.scheduled_date:%a %d %b} ({crew or 'no crew free'})"
        cplan = f"Installation is planned for {job.scheduled_date:%a %d %b %Y}."
    else:
        plan, cplan = "hardware-only sale, no installation", "Your equipment will be delivered to you."
    log(project, f"Order confirmed: advance received. Pick list {dispatch.code} created"
        + (" (waiting for stock)" if short else "") + f"; {plan}.",
        customer_message=f"Order confirmed. {cplan}", actor=actor)
    notify(users_with_role("warehouse"), f"Pack order {project.code}",
           f"{dispatch.lines.count()} items for {project.customer.name}" + (" (short on stock)" if short else ""),
           link=f"/app/inventory/dispatch/{dispatch.id}/")
    if job:
        notify([a.technician for a in job.assignments.select_related("technician")], f"New install job: {project.code}",
               f"{project.customer.name}, {job.scheduled_date:%a %d %b}", link="/app/field/")
    notify_customer(project.customer, "Order confirmed", cplan, link=f"/portal/p/{project.id}/")
    message_customer(project, "order_confirmed", f"Your order {project.code} is confirmed. {cplan}", path=f"/portal/p/{project.id}/")


def after_payment(project, actor=None):
    """Run whatever a newly confirmed payment unlocks."""
    if project.stage == Project.Stage.ACCEPTED and project.confirmed_paid_paise >= project.advance_required_paise:
        _confirm_order(project, actor)
        return True
    if project.stage in (Project.Stage.INSTALLED, Project.Stage.COMPLETED):
        from .accounts import maybe_complete
        maybe_complete(project)
        if project.balance_due_paise == 0:
            close_tasks(project, "collect_balance")
    return False


@transaction.atomic
def record_payment(actor, project, amount_paise, method, reference="", kind=None, invoice=None, status=None, note=""):
    """Record money received. Customers submitting a UPI/bank reference create a *pending* payment
    that only counts once Accounts verifies it; demo-checkout and staff-recorded payments confirm at once."""
    from_customer = actor is not None and actor.is_customer
    if not from_customer:
        require_role(actor, "accounts", "sales")
    quote = project.accepted_quote
    if invoice is None and quote is None:
        raise RuleError("There is no accepted quote to pay against.")
    amount_paise = int(amount_paise or 0)
    if amount_paise <= 0:
        raise RuleError("Enter an amount above zero.")
    if method not in Payment.Method.values:
        raise RuleError("Choose how the payment was made.")
    reference = (reference or "").strip()
    if method in ("upi", "bank", "cheque") and not reference:
        raise RuleError("Enter the transaction or cheque reference.")
    if status is None:
        status = Payment.Status.PENDING if (from_customer and method != "online_demo") else Payment.Status.CONFIRMED

    if invoice is not None and invoice.kind == "service":
        kind = Payment.Kind.SERVICE
        due = invoice.balance_paise
    else:
        due = project.balance_due_paise
        if kind is None:
            if project.stage == Project.Stage.ACCEPTED:
                kind = Payment.Kind.FULL if amount_paise >= due else Payment.Kind.ADVANCE
            else:
                kind = Payment.Kind.BALANCE
    if amount_paise > due:
        raise RuleError(f"That is more than the amount due ({inr(due)}).")

    payment = Payment.objects.create(
        project=project, invoice=invoice, kind=kind, amount_paise=amount_paise, method=method, reference=reference,
        status=status, submitted_by=actor, verified_by=None if status == Payment.Status.PENDING else actor, note=note)

    if status == Payment.Status.PENDING:
        add_task(project, "verify_payment", f"Verify payment {inr(amount_paise)} ({reference}) from {project.customer.name}",
                 "accounts", due_in=timedelta(hours=4), payment=payment)
        log(project, f"Customer submitted payment reference {reference} for {inr(amount_paise)}. Waiting for verification.",
            customer_message="Payment reference received. Your order is confirmed once we verify it.", actor=actor)
        notify(users_with_role("accounts"), f"Verify payment: {project.code}", f"{inr(amount_paise)} ref {reference}",
               link="/app/accounts/")
        return PaymentResult(payment, False, 0, "Payment reference received. Your order is confirmed once we verify it.")

    return _after_confirmed(project, payment, actor)


def _after_confirmed(project, payment, actor):
    paid = project.confirmed_paid_paise
    log(project, f"Payment {inr(payment.amount_paise)} received by {payment.get_method_display()}"
        + (f" (ref {payment.reference})" if payment.reference else "") + f". Total paid {inr(paid)}.",
        customer_message=f"Payment of {inr(payment.amount_paise)} received. Thank you.", actor=actor)
    notify_customer(project.customer, "Payment received", inr(payment.amount_paise), link=f"/portal/p/{project.id}/")
    confirmed = False
    shortfall = 0
    msg = f"Payment of {inr(payment.amount_paise)} recorded."
    if project.stage == Project.Stage.ACCEPTED:
        shortfall = max(project.advance_required_paise - paid, 0)
        if shortfall:
            msg = f"{inr(shortfall)} more needed to confirm the order (advance is {config.get('advance_pct')}%)."
    if payment.invoice_id and payment.invoice.balance_paise == 0:
        payment.invoice.status = "paid"
        payment.invoice.save(update_fields=["status"])
    confirmed = after_payment(project, actor)
    if confirmed:
        msg = "Advance received. Order confirmed."
    return PaymentResult(payment, confirmed, shortfall, msg)


@transaction.atomic
def verify_payment(actor, payment, approve=True, note=""):
    require_role(actor, "accounts")
    if payment.status != Payment.Status.PENDING:
        raise RuleError("This payment has already been reviewed.")
    project = payment.project
    close_tasks(project, "verify_payment", payment=payment)
    payment.verified_by = actor
    if not approve:
        payment.status = Payment.Status.REJECTED
        payment.note = (note or "Could not match this reference")[:200]
        payment.save()
        log(project, f"Payment reference {payment.reference} rejected: {payment.note}",
            customer_message="We could not match your payment reference. Please check it and submit again.", actor=actor)
        notify_customer(project.customer, "Payment reference not matched", payment.note, link=f"/portal/p/{project.id}/pay/")
        return PaymentResult(payment, False, 0, "Payment rejected.")
    payment.status = Payment.Status.CONFIRMED
    payment.received_at = clock.now()
    payment.save()
    return _after_confirmed(project, payment, actor)
