"""T5 build quote, T6 send quote, T7 accept quote, plus the draft-editing helpers."""
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .. import clock, config
from ..calc import pricing
from ..models import Product, Project, Quote, QuoteLine, Survey
from ..money import inr, pct_of
from .common import (RuleError, add_task, close_tasks, log, message_customer, notify, notify_customer,
                     require_role, set_stage, users_with_role)


def _approved_survey(project):
    return project.surveys.filter(status=Survey.Status.APPROVED).order_by("-id").first()


# ------------------------------------------------------------------ T5
@transaction.atomic
def build_quote(actor, project, template=None, discount_pct=0):
    require_role(actor, "sales", "engineer")
    template = template or pricing.default_template(project.kind, project.requested_kw)
    if template is None:
        raise RuleError(f"There is no kit template for {project.title}.")
    survey = _approved_survey(project)
    if template.requires_survey and survey is None:
        raise RuleError("Survey must be approved before a quote can be created.")
    if project.stage in (Project.Stage.ACCEPTED, Project.Stage.ORDERED, Project.Stage.DISPATCHED, Project.Stage.DELIVERED,
                         Project.Stage.INSTALLED, Project.Stage.COMPLETED, Project.Stage.LOST):
        raise RuleError("This project already has an accepted order or is closed.")
    if project.stage in (Project.Stage.ENQUIRY,) and template.requires_survey:
        raise RuleError("Qualify the enquiry first.")
    discount = Decimal(str(discount_pct or 0))
    if discount > config.get("max_discount_pct") and (actor is None or actor.role != "director"):
        raise RuleError(f"Discounts above {config.get('max_discount_pct')}% need the Director.")

    project.quotes.filter(status__in=[Quote.Status.DRAFT, Quote.Status.SENT]).update(status=Quote.Status.SUPERSEDED)
    version = (project.quotes.order_by("-version").values_list("version", flat=True).first() or 0) + 1
    quote = Quote.objects.create(project=project, version=version, template=template, kw=template.kw,
                                 discount_pct=discount, created_by=actor)
    pricing.build_lines(quote, template, survey)
    pricing.recalc(quote)
    log(project, f"Quote v{version} drafted from template '{template.name}': {inr(quote.total_paise)} incl. GST.", actor=actor)
    return quote


def _draft(quote):
    if quote.status != Quote.Status.DRAFT:
        raise RuleError("Only a draft quote can be edited.")


@transaction.atomic
def quote_set_discount(actor, quote, discount_pct):
    require_role(actor, "sales", "engineer")
    _draft(quote)
    try:
        d = Decimal(str(discount_pct or 0))
    except InvalidOperation:
        raise RuleError("Enter the discount as a number.")
    if d < 0 or d > 100:
        raise RuleError("Discount must be between 0 and 100%.")
    if d > config.get("max_discount_pct") and (actor is None or actor.role != "director"):
        raise RuleError(f"Discounts above {config.get('max_discount_pct')}% need the Director.")
    quote.discount_pct = d
    pricing.recalc(quote)


@transaction.atomic
def quote_update_lines(actor, quote, qty_by_line: dict):
    """qty_by_line: {line_id: quantity}. Edited lines stop being 'auto'."""
    require_role(actor, "sales", "engineer")
    _draft(quote)
    for line in quote.lines.all():
        if line.pk in qty_by_line:
            try:
                q = Decimal(str(qty_by_line[line.pk]))
            except InvalidOperation:
                raise RuleError(f"Quantity for {line.description} is not a number.")
            if q <= 0:
                raise RuleError(f"Quantity for {line.description} must be above zero. Use Remove to delete the line.")
            if q != line.qty:
                line.qty = q
                line.is_auto = False
                line.save()
    pricing.recalc(quote)


@transaction.atomic
def quote_add_line(actor, quote, product, qty=1):
    require_role(actor, "sales", "engineer")
    _draft(quote)
    if quote.lines.filter(product=product).exists():
        raise RuleError(f"{product.name} is already on the quote. Change its quantity instead.")
    QuoteLine.objects.create(quote=quote, product=product, description=product.name, category=product.category,
                             qty=Decimal(str(qty)), unit_price_paise=product.price_paise, tax_pct=product.tax_pct,
                             is_auto=False, sort=quote.lines.count() + 1)
    pricing.recalc(quote)


@transaction.atomic
def quote_remove_line(actor, quote, line_id):
    require_role(actor, "sales", "engineer")
    _draft(quote)
    quote.lines.filter(pk=line_id).delete()
    pricing.recalc(quote)


@transaction.atomic
def quote_reset(actor, quote):
    require_role(actor, "sales", "engineer")
    _draft(quote)
    pricing.build_lines(quote, quote.template, _approved_survey(quote.project))
    pricing.recalc(quote)


# ------------------------------------------------------------------ T6
@transaction.atomic
def send_quote(actor, quote, override_reason=""):
    require_role(actor, "sales", "engineer")
    if quote.status != Quote.Status.DRAFT:
        raise RuleError("Only a draft quote can be sent.")
    project = quote.project
    missing = pricing.missing_categories(quote)
    if missing:
        if override_reason and actor is not None and actor.role in ("engineer", "director"):
            quote.override_reason = override_reason[:200]
        else:
            raise RuleError(f"Required parts missing: {', '.join(missing)}.")
    quote.status = Quote.Status.SENT
    quote.sent_at = clock.now()
    quote.valid_until = clock.today() + timedelta(days=config.get("quote_valid_days"))
    quote.save()
    set_stage(project, Project.Stage.QUOTED)
    add_task(project, "followup", "Follow up on the quote", "sales", due_in=timedelta(days=config.get("followup_days")))
    extra = f" (parts check overridden: {quote.override_reason})" if quote.override_reason else ""
    log(project, f"Quote v{quote.version} sent: {inr(quote.total_paise)} incl. GST{extra}.",
        customer_message=f"Your quote is ready: {inr(quote.total_paise)} including GST. Review and accept it in your account.",
        actor=actor)
    notify_customer(project.customer, "Your quote is ready", f"{inr(quote.total_paise)} incl. GST", link=f"/portal/p/{project.id}/quote/")
    message_customer(project, "quote_sent",
                     f"Your quote {project.code} for a {project.title} system is ready: {inr(quote.total_paise)} incl. GST.",
                     path=f"/portal/p/{project.id}/quote/")
    return quote


# ------------------------------------------------------------------ T7
@transaction.atomic
def accept_quote(actor, quote, accepted_by_name, on_behalf_note=""):
    project = quote.project
    if quote.status != Quote.Status.SENT:
        raise RuleError("This quote is not open for acceptance.")
    if quote.valid_until and quote.valid_until < clock.today():
        raise RuleError("This quote has expired. Ask us to refresh it.")
    accepted_by_name = (accepted_by_name or "").strip()
    if not accepted_by_name:
        raise RuleError("Type your full name to accept the quote.")
    staff = actor is not None and actor.is_backoffice
    if staff:
        require_role(actor, "sales", "engineer")
        if not (on_behalf_note or "").strip():
            raise RuleError("Note how the customer accepted (for example, phone call).")
    quote.status = Quote.Status.ACCEPTED
    quote.accepted_at = clock.now()
    quote.accepted_by_name = accepted_by_name
    quote.save()
    project.quotes.exclude(pk=quote.pk).filter(status__in=[Quote.Status.DRAFT, Quote.Status.SENT]).update(status=Quote.Status.SUPERSEDED)
    project.contract_value_paise = quote.subtotal_paise
    project.advance_required_paise = pct_of(quote.total_paise, config.get("advance_pct"))
    project.save(update_fields=["contract_value_paise", "advance_required_paise"])
    set_stage(project, Project.Stage.ACCEPTED)
    close_tasks(project, "followup")
    how = f" on behalf of the customer ({on_behalf_note.strip()})" if staff else ""
    log(project, f"Quote v{quote.version} accepted by {accepted_by_name}{how}.",
        customer_message=f"Quote accepted. Pay the advance of {inr(project.advance_required_paise)} to confirm your order.", actor=actor)
    add_task(project, "collect_advance", f"Collect advance {inr(project.advance_required_paise)} from {project.customer.name}",
             "accounts", due_in=timedelta(days=2))
    notify(users_with_role("accounts"), f"Advance due: {project.code}",
           f"{project.customer.name}: {inr(project.advance_required_paise)}", link=f"/app/p/{project.id}/?tab=payments")
    notify(project.owner, f"Quote accepted: {project.code}", project.customer.name, link=f"/app/p/{project.id}/")
    return quote


@transaction.atomic
def ask_question(actor, project, text):
    """A customer question about their quote or project goes to the owner as a notification and a timeline note."""
    if actor is None or not actor.is_customer or project.customer.user_id != actor.id:
        raise RuleError("You can only ask about your own project.", "forbidden")
    text = (text or "").strip()
    if not text:
        raise RuleError("Type your question first.")
    log(project, f"Customer question: {text[:240]}", customer_message="We received your question and will reply shortly.", actor=actor)
    notify(project.owner, f"Question from {project.customer.name}", text[:140], link=f"/app/p/{project.id}/")
