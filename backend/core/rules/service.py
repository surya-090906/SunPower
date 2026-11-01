"""T14 open ticket, T15 resolve ticket (covered = free, otherwise billed), T16 confirm or reopen."""
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .. import clock, config
from ..calc import stock
from ..calc.schedule import pick_technicians
from ..calc.warranty import warranty_state
from ..calc.support import installation_finished
from ..models import Invoice, InvoiceLine, Product, Project, Serial, StockMove, Ticket, TicketLine
from ..money import inr, pct_of
from ..utils import add_months, next_working_day
from .common import (RuleError, log, message_customer, notify, notify_customer, post_ledger, require_role,
                     users_with_role)
from .stock import norm_serial

SERVICE_TAX_PCT = 18


def _evaluate_coverage(ticket):
    s = ticket.serial
    if s is None:
        ticket.covered = None
        ticket.coverage_note = "No specific unit selected: the warranty will be checked on the visit."
    else:
        w = warranty_state(s)
        ticket.covered = w.covered
        if w.covered:
            ticket.coverage_note = f"Covered until {w.end:%d %b %Y}. No charge."
        elif w.state == "void":
            ticket.coverage_note = f"Not covered: {s.exclusion_reason}. Parts and labour will be invoiced after the visit."
        elif w.end:
            ticket.coverage_note = f"Warranty ended on {w.end:%d %b %Y}. Parts and labour will be invoiced after the visit."
        else:
            ticket.coverage_note = "This item has no warranty. Parts and labour will be invoiced after the visit."
    ticket.save(update_fields=["covered", "coverage_note"])


# ------------------------------------------------------------------ T14
@transaction.atomic
def open_ticket(actor, customer, *, serial=None, project=None, fault_code="", description="", source="call"):
    if actor is not None and actor.is_customer:
        if customer.user_id != actor.id:
            raise RuleError("You can only raise requests for your own systems.", "forbidden")
    elif actor is not None:
        require_role(actor, "support", "technician", "engineer")
    if serial is not None:
        if serial.project is None or serial.project.customer_id != customer.id:
            raise RuleError("That unit does not belong to this customer.")
        if serial.status != Serial.Status.DELIVERED:
            raise RuleError("That unit has not been delivered, so it cannot be serviced.")
        project = serial.project
    elif project is None:
        project = customer.projects.filter(
            stage__in=[Project.Stage.DELIVERED, Project.Stage.INSTALLED, Project.Stage.COMPLETED]).order_by("-created_at").first()
        if project is None:
            raise RuleError("This customer has no installed system yet.")
    elif project.customer_id != customer.id:
        raise RuleError("That project does not belong to this customer.")
    if actor is not None and actor.is_customer and not installation_finished(project):
        raise RuleError('You can report a problem after installation is complete.')
    fault_code = (fault_code or "").strip()
    description = (description or "").strip()
    if not fault_code and not description:
        raise RuleError("Describe the problem or enter the fault code shown on the inverter.")

    ticket = Ticket.objects.create(customer=customer, project=project, serial=serial, source=source, fault_code=fault_code,
                                   description=description, created_by=actor, created_at=clock.now())
    _evaluate_coverage(ticket)
    day, techs = pick_technicians(clock.today() + timedelta(days=1), 1, "ticket")
    if techs:
        ticket.assignee = techs[0]
        ticket.status = Ticket.Status.ASSIGNED
    ticket.visit_date = day
    ticket.save(update_fields=["assignee", "status", "visit_date"])

    what = f"{serial.product.name} (SN {serial.serial_no})" if serial else "an unspecified unit"
    log(project, f"Ticket {ticket.code} opened via {ticket.get_source_display()} for {what}"
        + (f", fault {fault_code}" if fault_code else "") + f". {ticket.coverage_note}",
        customer_message=f"Service request {ticket.code} received. {ticket.coverage_note}"
        + (f" A technician visits on {day:%a %d %b}." if techs else ""), actor=actor)
    if ticket.assignee:
        notify(ticket.assignee, f"Service visit: {ticket.code}", f"{customer.name}, {day:%a %d %b}", link=f"/app/help/tickets/{ticket.id}/")
    notify(users_with_role("support"), f"New ticket {ticket.code}", f"{customer.name}: {fault_code or description[:60]}",
           link=f"/app/help/tickets/{ticket.id}/")
    message_customer(project, "ticket_opened", f"Service request {ticket.code} received. {ticket.coverage_note}", path=f"/portal/requests/{ticket.id}/")
    return ticket


@transaction.atomic
def set_exclusion(actor, serial, reason):
    """Support marks a unit as not covered (for example physical damage or lightning)."""
    require_role(actor, "support", "engineer")
    reason = (reason or "").strip()
    if not reason:
        raise RuleError("Give the reason the warranty does not apply.")
    serial.exclusion_reason = reason[:200]
    serial.save(update_fields=["exclusion_reason"])
    for t in serial.tickets.exclude(status=Ticket.Status.CLOSED):
        _evaluate_coverage(t)


# ------------------------------------------------------------------ T15
def _create_service_invoice(ticket, lines):
    inv = Invoice.objects.create(project=ticket.project, ticket=ticket, kind=Invoice.Kind.SERVICE,
                                 due_date=clock.today() + timedelta(days=7), issue_date=clock.today())
    sub = tax = 0
    for l in lines:
        if not l.billable:
            continue
        net = int((Decimal(l.qty) * l.unit_price_paise).quantize(Decimal("1")))
        pct = l.product.tax_pct if l.product_id else SERVICE_TAX_PCT
        t = pct_of(net, pct)
        InvoiceLine.objects.create(invoice=inv, description=l.description, qty=l.qty, unit_price_paise=l.unit_price_paise,
                                   tax_pct=pct, net_paise=net, tax_paise=t)
        sub += net
        tax += t
    inv.subtotal_paise, inv.tax_paise, inv.total_paise = sub, tax, sub + tax
    inv.save()
    return inv


@transaction.atomic
def resolve_ticket(actor, ticket, *, notes, hours, fault_serial_no="", replacement_serial_no="", extra_parts=None):
    require_role(actor, "technician", "support", "engineer")
    if ticket.status not in (Ticket.Status.NEW, Ticket.Status.ASSIGNED, Ticket.Status.REOPENED):
        raise RuleError("This request is already resolved or closed.")
    notes = (notes or "").strip()
    if not notes:
        raise RuleError("Describe what was done.")
    try:
        hours = Decimal(str(hours))
    except (InvalidOperation, TypeError):
        hours = Decimal(0)
    if hours <= 0:
        raise RuleError("Enter the hours spent on the visit.")
    project = ticket.project

    if fault_serial_no and ticket.serial is None:
        fs = Serial.objects.select_related("project").filter(serial_no=norm_serial(fault_serial_no)).first()
        if fs is None or fs.project is None or fs.project.customer_id != ticket.customer_id:
            raise RuleError("That serial does not belong to this customer.")
        ticket.serial = fs
        ticket.save(update_fields=["serial"])
        _evaluate_coverage(ticket)
    covered = bool(ticket.covered)
    old = ticket.serial

    rep = None
    if replacement_serial_no:
        if old is None:
            raise RuleError("Select the faulty unit before recording a replacement.")
        rep = Serial.objects.select_related("product").filter(serial_no=norm_serial(replacement_serial_no)).first()
        if rep is None or rep.status != Serial.Status.IN_STOCK:
            raise RuleError("Replacement serial is not in stock.")
        if rep.product_id != old.product_id:
            raise RuleError("The replacement must be the same product as the faulty unit.")

    tech = ticket.assignee or actor
    rate = tech.hourly_rate_paise if tech else 0
    billable = not covered
    lines = [
        TicketLine(ticket=ticket, kind="visit", description="Service visit", qty=1, unit_cost_paise=0,
                   unit_price_paise=config.get("visit_price_paise"), billable=billable),
        TicketLine(ticket=ticket, kind="labour", description=f"Technician labour ({hours} h)", qty=hours,
                   unit_cost_paise=rate, unit_price_paise=config.get("labour_price_paise_per_hour"), billable=billable),
    ]
    parts_cost = 0
    if rep:
        lines.append(TicketLine(ticket=ticket, kind="part", product=rep.product, serial=rep,
                                description=f"{rep.product.name} (replacement, SN {rep.serial_no})", qty=1,
                                unit_cost_paise=rep.unit_cost_paise, unit_price_paise=rep.product.price_paise, billable=billable))
        parts_cost += rep.unit_cost_paise
    for pid, q in (extra_parts or []):
        p = Product.objects.get(pk=pid)
        q = Decimal(str(q))
        if p.tracked_by_serial:
            raise RuleError(f"{p.name} is serial-tracked: use the replacement serial field.")
        if stock.available(p) < q:
            raise RuleError(f"Not enough {p.name} in stock.")
        unit = p.avg_cost_paise or p.cost_paise
        StockMove.objects.create(product=p, qty_delta=-q, reason="ticket", project=project, unit_cost_paise=unit)
        lines.append(TicketLine(ticket=ticket, kind="part", product=p, description=p.name, qty=q, unit_cost_paise=unit,
                                unit_price_paise=p.price_paise, billable=billable))
        parts_cost += int(q * unit)
    TicketLine.objects.bulk_create(lines)
    labour_cost = int(hours * rate)

    if rep:  # swap the unit
        rep.status = Serial.Status.DELIVERED
        rep.project = project
        rep.delivered_at = clock.now()
        rep.replaces = old
        rep.warranty_start = clock.today()
        if covered:  # replacement inherits the remaining warranty
            rep.warranty_end, rep.warranty_months = old.warranty_end, old.warranty_months
        else:        # the customer bought it: fresh warranty
            rep.warranty_months = rep.product.warranty_months
            rep.warranty_end = add_months(clock.today(), rep.warranty_months) if rep.warranty_months else None
        rep.save()
        old.status = Serial.Status.REPLACED
        old.save(update_fields=["status"])

    invoice = None
    if covered:
        post_ledger(project, "cost", "warranty_material", parts_cost, "ticket", ticket.id, f"{ticket.code} parts under warranty")
        post_ledger(project, "cost", "warranty_labour", labour_cost, "ticket", ticket.id, f"{ticket.code} labour under warranty")
    else:
        invoice = _create_service_invoice(ticket, lines)
        post_ledger(project, "revenue", "service", invoice.subtotal_paise, "invoice", invoice.id, f"{ticket.code} service invoice")
        post_ledger(project, "cost", "service_material", parts_cost, "ticket", ticket.id)
        post_ledger(project, "cost", "service_labour", labour_cost, "ticket", ticket.id)

    ticket.status = Ticket.Status.RESOLVED
    ticket.resolved_at = clock.now()
    ticket.resolution_notes = notes
    ticket.save()
    if covered:
        cm = f"Service request {ticket.code} is resolved at no charge. Please confirm that everything works."
        internal = f"Ticket {ticket.code} resolved under warranty (cost to us {inr(parts_cost + labour_cost)}): {notes}"
    else:
        cm = (f"Service request {ticket.code} is resolved. Service invoice {invoice.number} for {inr(invoice.total_paise)} "
              f"is ready. Please confirm that everything works.")
        internal = f"Ticket {ticket.code} resolved, billed {inr(invoice.total_paise)} (invoice {invoice.number}): {notes}"
    log(project, internal, customer_message=cm, actor=actor)
    notify_customer(ticket.customer, f"{ticket.code} resolved", "Please confirm that everything works", link=f"/portal/requests/{ticket.id}/")
    message_customer(project, "ticket_resolved", cm, path=f"/portal/requests/{ticket.id}/")
    return ticket


# ------------------------------------------------------------------ T16
@transaction.atomic
def confirm_ticket(actor, ticket, works, note="", rating=None):
    if actor is not None and actor.is_customer and actor.id != ticket.customer.user_id:
        raise RuleError("You can only respond to your own requests.", "forbidden")
    if actor is not None and not actor.is_customer:  # staff only record what the customer told them on the visit
        require_role(actor, "technician", "support", "engineer")
    if ticket.status != Ticket.Status.RESOLVED:
        raise RuleError("This request is not waiting for confirmation.")
    project = ticket.project
    if works:
        ticket.status = Ticket.Status.CLOSED
        ticket.closed_at = clock.now()
        if rating is not None:
            try:
                ticket.rating = max(1, min(5, int(rating)))
            except (ValueError, TypeError):
                pass
        ticket.save()
        rate_msg = f" (Rated {ticket.rating}/5 stars)" if ticket.rating else ""
        if project:
            log(project, f"Ticket {ticket.code} closed: customer confirmed everything works.{rate_msg}",
                customer_message=f"Request {ticket.code} is closed. Thank you for confirming.{rate_msg}", actor=actor)
        notify(ticket.assignee, f"{ticket.code} closed", f"Customer confirmed it works.{rate_msg}", link=f"/app/help/tickets/{ticket.id}/")
        return ticket
    ticket.status = Ticket.Status.REOPENED
    ticket.reopen_count += 1
    ticket.resolved_at = None
    ticket.visit_date = next_working_day(clock.today() + timedelta(days=1))
    ticket.save()
    log(project, f"Ticket {ticket.code} reopened: customer says it is still not working. {note}".strip(),
        customer_message=f"We're sorry. Request {ticket.code} is reopened and a technician will revisit on {ticket.visit_date:%a %d %b}.",
        actor=actor)
    notify([ticket.assignee] if ticket.assignee else users_with_role("support"), f"{ticket.code} reopened",
           "Customer says it is still not working.", link=f"/app/help/tickets/{ticket.id}/")
    return ticket


@transaction.atomic
def close_ticket(actor, ticket, override_reason=""):
    """Staff cannot close a ticket on their own. Only the Director may, with a reason."""
    if actor is None or actor.role != "director":
        raise RuleError("Waiting for the customer's confirmation.")
    if not (override_reason or "").strip():
        raise RuleError("Give a reason for closing without the customer's confirmation.")
    ticket.status = Ticket.Status.CLOSED
    ticket.closed_at = clock.now()
    ticket.close_override_reason = override_reason.strip()[:200]
    ticket.save()
    log(ticket.project, f"Ticket {ticket.code} force-closed by the Director: {ticket.close_override_reason}", actor=actor)
    return ticket
