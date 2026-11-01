"""T13 project completion, subsidy steps, manual costs, portal invitations."""
from django.db import transaction

from .. import clock
from ..models import Customer, Project, Role, Task, User
from ..money import inr
from ..utils import new_token
from .common import RuleError, log, message_customer, notify_customer, post_ledger, require_role, set_stage


# ------------------------------------------------------------------ T13
def maybe_complete(project):
    """Complete the project once the balance is zero and every subsidy step is done or N/A."""
    if project.stage != Project.Stage.INSTALLED:
        return False
    if project.balance_due_paise > 0:
        return False
    if project.tasks.filter(kind="subsidy").exclude(status__in=[Task.Status.DONE, Task.Status.NA]).exists():
        return False
    project.completed_at = clock.now()
    project.save(update_fields=["completed_at"])
    set_stage(project, Project.Stage.COMPLETED)
    log(project, "Project completed: fully paid and paperwork done. Warranties keep running per serial.",
        customer_message="All done: payment and paperwork are complete. Your warranty is active.")
    return True


@transaction.atomic
def complete_task(actor, task, note="", not_applicable=False):
    require_role(actor, "accounts", "sales", "engineer")
    if task.status == Task.Status.DONE:
        raise RuleError("This step is already done.")
    if task.status == Task.Status.BLOCKED:
        raise RuleError("This step is waiting for the installation to be signed off.")
    task.status = Task.Status.NA if not_applicable else Task.Status.DONE
    task.done_at = clock.now()
    task.save()
    project = task.project
    if task.kind == "subsidy":
        total = project.tasks.filter(kind="subsidy").count()
        done = project.tasks.filter(kind="subsidy", status__in=[Task.Status.DONE, Task.Status.NA]).count()
        log(project, f"Subsidy step done: {task.title} ({done} of {total}).",
            customer_message=f"Subsidy paperwork: {task.title} is done ({done} of {total}).", actor=actor)
        notify_customer(project.customer, "Subsidy paperwork update", f"{task.title} ({done} of {total})", link=f"/portal/p/{project.id}/")
    else:
        log(project, f"Task done: {task.title}", actor=actor)
    maybe_complete(project)
    return task


@transaction.atomic
def add_cost(actor, project, amount_paise, note):
    require_role(actor, "accounts")
    if int(amount_paise or 0) <= 0:
        raise RuleError("Enter an amount above zero.")
    if not (note or "").strip():
        raise RuleError("Say what the cost was for.")
    post_ledger(project, "cost", "other", int(amount_paise), "manual", None, note)
    log(project, f"Cost added: {inr(int(amount_paise))} ({note}).", actor=actor)


# ------------------------------------------------------------------ portal accounts
@transaction.atomic
def invite_customer(actor, customer):
    """Create (or refresh) the one-time activation link for a staff-entered customer."""
    require_role(actor, "sales", "support", "accounts")
    if customer.user_id:
        raise RuleError("This customer already has a login.")
    customer.claim_token = new_token()
    customer.invited_at = clock.now()
    customer.save(update_fields=["claim_token", "invited_at"])
    project = customer.projects.order_by("-created_at").first()
    if project:
        message_customer(project, "portal_invite",
                         f"Hi {customer.name.split(' ')[0]}, activate your SunPower account to track your project and warranty.")
        log(project, "Portal invitation sent.", actor=actor)
    return customer


@transaction.atomic
def claim_account(token, password):
    if not token:
        raise RuleError("This activation link is not valid.")
    customer = Customer.objects.filter(claim_token=token, user__isnull=True).first()
    if customer is None:
        raise RuleError("This activation link is not valid or was already used.")
    if len(password or "") < 6:
        raise RuleError("Choose a password of at least 6 characters.")
    first, _, last = customer.name.partition(" ")
    username = customer.phone if not User.objects.filter(username=customer.phone).exists() else f"c{customer.phone}"
    user = User.objects.create_user(username=username, password=password, first_name=first, last_name=last,
                                    email=customer.email, phone=customer.phone, role=Role.CUSTOMER)
    customer.user = user
    customer.claim_token = ""
    customer.claimed_at = clock.now()
    customer.save()
    return user


@transaction.atomic
def customer_confirm_install(project, actor):
    require_role(actor, Role.CUSTOMER)
    if project.stage != Project.Stage.INSTALLED:
        raise RuleError("The installation is not yet ready for confirmation.")
    if project.customer.user_id != actor.id:
        raise RuleError("This is not your project.")
    log(project, "Customer confirmed the installation.",
        customer_message="You confirmed the installation looks good. We are preparing your final documents.",
        kind="milestone", actor=actor)
    maybe_complete(project)
