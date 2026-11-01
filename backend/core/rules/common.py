"""Plumbing shared by every workflow rule.

A rule is one function that checks its guard, then changes state and writes its side effects
(timeline, notifications, ledger, customer messages) in a single DB transaction. Screens never
change a stage directly.
"""
from datetime import timedelta

from django.conf import settings

from .. import clock
from ..models import LedgerEntry, MessageLog, Notification, Project, Task, TimelineEvent, User
from ..utils import wa_link


class RuleError(Exception):
    """A guard blocked the action. `message` is shown to the user verbatim."""

    def __init__(self, message, code="blocked"):
        super().__init__(message)
        self.message = message
        self.code = code


def require_role(actor, *roles):
    """Staff-only guard. actor=None means the system itself. Directors may do anything."""
    if actor is None or actor.role == "director" or actor.role in roles:
        return
    raise RuleError("You don't have permission to do this.", "forbidden")


def log(project, message, customer_message="", actor=None, kind="info"):
    """Timeline entry. `customer_message` empty means the customer never sees it."""
    return TimelineEvent.objects.create(
        project=project, actor=actor, kind=kind, message=message[:300], customer_message=customer_message[:300])


def users_with_role(*roles):
    return list(User.objects.filter(role__in=roles, is_active=True))


def notify(to, title, body="", link=""):
    if to is None:
        return
    users = [to] if isinstance(to, User) else [u for u in to if u is not None]
    Notification.objects.bulk_create(
        [Notification(to_user=u, title=title[:160], body=body[:300], link=link) for u in users])


def notify_customer(customer, title, body="", link=""):
    if customer.user_id:
        notify(customer.user, title, body, link)


def message_customer(project, template, body, path=""):
    """Queue an outbound customer message as a wa.me deep link (no WhatsApp API needed)."""
    customer = project.customer
    if customer.user_id is None and customer.claim_token:
        path = f"/claim/{customer.claim_token}/"
    text = f"{body} {settings.SITE_URL}{path}" if path else body
    return MessageLog.objects.create(
        customer=customer, project=project, template=template, body=text, wa_link=wa_link(customer.phone, text))


def post_ledger(project, kind, category, amount_paise, ref_type="", ref_id=None, note=""):
    if not amount_paise:
        return None
    return LedgerEntry.objects.create(
        project=project, kind=kind, category=category, amount_paise=int(amount_paise),
        ref_type=ref_type, ref_id=ref_id, note=note[:200])


def add_task(project, kind, title, owner_role, due_in=None, seq=0, status=Task.Status.OPEN, payment=None):
    return Task.objects.create(
        project=project, kind=kind, title=title[:200], owner_role=owner_role, seq=seq, status=status,
        due_at=(clock.now() + due_in) if due_in is not None else None, payment=payment)


def close_tasks(project, *kinds, payment=None):
    qs = Task.objects.filter(project=project, kind__in=kinds, status__in=[Task.Status.OPEN, Task.Status.BLOCKED])
    if payment is not None:
        qs = qs.filter(payment=payment)
    qs.update(status=Task.Status.DONE, done_at=clock.now())


def set_stage(project, stage):
    project.stage = stage
    project.stage_since = clock.now()
    project.save(update_fields=["stage", "stage_since"])


def days(n):
    return timedelta(days=n)
