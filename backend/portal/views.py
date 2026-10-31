"""Customer portal. Every query is scoped to request.customer (taken from the session, never from the URL).

Templates here only ever print customer-safe fields: no ledger, costs, margins, stock or internal notes.
"""
from functools import wraps

from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from core import config, rules
from core.calc.tracker import customer_tracker
from core.calc.warranty import warranty_state
from core.forms import to_paise
from core.models import Invoice, Payment, Project, Serial, Ticket
from core.money import inr
from core.rules import RuleError


def customer_only(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(f"/login/?next={request.path}")
        if not request.user.is_customer:
            return redirect("/app/")
        customer = getattr(request.user, "customer_profile", None)
        if customer is None:
            raise PermissionDenied
        request.customer = customer
        return view(request, *args, **kwargs)
    return wrapper


def own_project(request, pk):
    return get_object_or_404(Project, pk=pk, customer=request.customer)


def flash_error(request, err):
    messages.error(request, err.message)


# ------------------------------------------------------------------ home + project
@customer_only
def home(request):
    cards = [{"p": p, "t": customer_tracker(p)} for p in request.customer.projects.select_related("customer").order_by("-created_at")]
    open_requests = request.customer.tickets.exclude(status=Ticket.Status.CLOSED).count()
    return render(request, "portal/home.html", {"cards": cards, "open_requests": open_requests})


@customer_only
def project(request, pk):
    p = own_project(request, pk)
    survey = p.survey
    job = getattr(p, "job", None)
    quote = p.accepted_quote or p.quotes.filter(status="sent").order_by("-version").first()
    dispatch = p.dispatches.exclude(status__in=["awaiting_stock", "to_pick", "ready"]).order_by("-id").first()
    ctx = {
        "p": p, "t": customer_tracker(p), "survey": survey if survey and survey.status == "requested" else None, "job": job,
        "crew": list(job.assignments.select_related("technician")) if job else [],
        "events": p.timeline.exclude(customer_message="")[:25], "quote": quote, "dispatch": dispatch,
        "payments": p.payments.all(), "invoices": p.invoices.all(), "tickets": p.tickets.all(),
        "has_systems": p.serials.filter(status="delivered").exists(),
        "signed": job is not None and job.status == "signed_off",
    }
    return render(request, "portal/project.html", ctx)


@customer_only
@require_POST
def slot(request, pk, kind):
    p = own_project(request, pk)
    try:
        rules.customer_slot(request.user, p, kind, request.POST.get("action") == "confirm", request.POST.get("note", ""))
        messages.success(request, "Thanks, we have noted that." if request.POST.get("action") == "confirm" else "We have noted your request.")
    except RuleError as e:
        flash_error(request, e)
    return redirect(f"/portal/p/{p.id}/")


# ------------------------------------------------------------------ quote (T7)
@customer_only
def quote(request, pk):
    p = own_project(request, pk)
    q = p.accepted_quote or p.quotes.filter(status="sent").order_by("-version").first()
    if q is None:
        messages.info(request, "There is no quote to review yet.")
        return redirect(f"/portal/p/{p.id}/")
    if request.method == "POST":
        try:
            if request.POST.get("action") == "ask":
                rules.ask_question(request.user, p, request.POST.get("text", ""))
                messages.success(request, "Question sent. We will reply shortly.")
            else:
                if not request.POST.get("terms"):
                    raise RuleError("Tick the box to confirm you accept the quote and its terms.")
                rules.accept_quote(request.user, q, request.POST.get("name", ""))
                messages.success(request, "Quote accepted. Pay the advance to confirm your order.")
                return redirect(f"/portal/p/{p.id}/pay/")
        except RuleError as e:
            flash_error(request, e)
        return redirect(f"/portal/p/{p.id}/quote/")
    lines = list(q.lines.select_related("product"))
    return render(request, "portal/quote.html", {
        "p": p, "q": q, "lines": lines, "advance": p.advance_required_paise or int(q.total_paise * config.get("advance_pct") / 100),
        "advance_pct": config.get("advance_pct"), "discount_paise": q.gross_paise - q.subtotal_paise})


# ------------------------------------------------------------------ pay (T8)
@customer_only
def pay(request, pk):
    p = own_project(request, pk)
    invoice = None
    inv_id = request.GET.get("invoice") or request.POST.get("invoice")
    if inv_id:
        invoice = get_object_or_404(Invoice, pk=inv_id, project=p, kind="service")
    if invoice:
        due, choices = invoice.balance_paise, []
        title = f"Service invoice {invoice.number}"
    else:
        due = p.balance_due_paise
        min_due = max(p.advance_required_paise - p.confirmed_paid_paise, 0) if p.stage == "accepted" else 0
        choices = [("min", f"Advance ({config.get('advance_pct')}%)", min_due), ("full", "Full amount", due)] if min_due and min_due < due else []
        title = "Pay advance" if p.stage == "accepted" else "Pay balance"
    if request.method == "POST" and due:
        try:
            pick = request.POST.get("amount", "full")
            amount = next((c[2] for c in choices if c[0] == pick), None) or (
                max(p.advance_required_paise - p.confirmed_paid_paise, 0) if p.stage == "accepted" and not invoice and not choices else due)
            if request.POST.get("mode") == "checkout":
                res = rules.record_payment(request.user, p, amount, "online_demo", invoice=invoice)
            else:
                paise = to_paise(request.POST.get("custom_amount")) or amount
                res = rules.record_payment(request.user, p, paise, request.POST.get("method", "upi"),
                                           request.POST.get("reference", ""), invoice=invoice)
            messages.success(request, res.message)
            return redirect(f"/portal/p/{p.id}/")
        except RuleError as e:
            flash_error(request, e)
    return render(request, "portal/pay.html", {
        "p": p, "invoice": invoice, "due": due, "choices": choices, "title": title,
        "payments": p.payments.all()[:8], "upi": config.get("company_upi"), "bank": config.get("company_bank"),
        "default_choice": "min" if choices else "full"})


# ------------------------------------------------------------------ systems and warranty
@customer_only
def systems(request):
    groups = []
    for p in request.customer.projects.order_by("-created_at"):
        units = [{"s": s, "w": warranty_state(s)} for s in
                 Serial.objects.filter(project=p, status="delivered").select_related("product").order_by("product__category", "serial_no")]
        if units:
            groups.append({"p": p, "units": units})
    return render(request, "portal/systems.html", {"groups": groups})


# ------------------------------------------------------------------ service requests (T14, T16)
@customer_only
def requests_list(request):
    return render(request, "portal/requests.html", {"tickets": request.customer.tickets.select_related("serial__product", "project")})


@customer_only
def request_new(request):
    units = Serial.objects.filter(project__customer=request.customer, status="delivered").select_related("product", "project").order_by(
        "project_id", "product__category", "serial_no")
    if request.method == "POST":
        serial = units.filter(pk=request.POST.get("serial") or 0).first()
        if serial is None:  # missing, or not one of this customer's own units
            messages.error(request, "Choose the unit that has the fault from your own systems.")
            rows = [{"s": s, "w": warranty_state(s)} for s in units]
            return render(request, "portal/request_new.html", {"rows": rows, "pick": "", "form": request.POST})
        try:
            t = rules.open_ticket(request.user, request.customer, serial=serial, project=serial.project,
                                  fault_code=request.POST.get("fault_code", ""), description=request.POST.get("description", ""),
                                  source="portal")
            messages.success(request, f"Request {t.code} received.")
            return redirect(f"/portal/requests/{t.id}/")
        except RuleError as e:
            flash_error(request, e)
    rows = [{"s": s, "w": warranty_state(s)} for s in units]
    return render(request, "portal/request_new.html", {"rows": rows, "pick": request.GET.get("serial", request.POST.get("serial", "")),
                                                          "form": request.POST})


@customer_only
def request_detail(request, pk):
    t = get_object_or_404(Ticket, pk=pk, customer=request.customer)
    events = t.project.timeline.filter(customer_message__contains=t.code) if t.project else []
    return render(request, "portal/request.html", {"t": t, "events": events, "invoice": t.invoices.first(),
                                                      "warranty": warranty_state(t.serial) if t.serial else None})


@customer_only
@require_POST
def request_confirm(request, pk):
    t = get_object_or_404(Ticket, pk=pk, customer=request.customer)
    try:
        rules.confirm_ticket(request.user, t, request.POST.get("works") == "1", request.POST.get("note", ""))
        messages.success(request, "Thank you. Request closed." if request.POST.get("works") == "1"
                         else "We are sorry. A technician will revisit.")
    except RuleError as e:
        flash_error(request, e)
    return redirect(f"/portal/requests/{t.id}/")
