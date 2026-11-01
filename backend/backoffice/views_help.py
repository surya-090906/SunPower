"""Helpdesk: universal search, customer 360, tickets (T14, T15, T16)."""
from core.api import page

from django.contrib import messages
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST

from core import rules
from core.calc.warranty import warranty_state
from core.models import Customer, Product, Project, Serial, Ticket
from core.rules import RuleError
from core.utils import normalize_phone

from .utils import run, staff_required



FAULT_HINTS = {
    "E01": "DC Insulation / Ground fault. Often caused by moisture or damaged MC4 cables on the roof.",
    "E04": "Grid Voltage / Frequency out of range. Typically caused by DISCOM grid voltage fluctuations or loose AC wiring.",
    "E07": "Inverter Over-Temperature. Check heatsink clearance, ventilation, and direct afternoon sun exposure.",
    "E12": "Low Isolation Resistance. Very common after heavy rainfall; inspect DC isolators and roof array earthing.",
    "BAT-E12": "Battery BMS Communication or Low Voltage trip. Inspect RS485/CAN cable and cell voltages.",
    "No display": "No power to display. Check whether DC switch and AC isolators are turned on, and test string voltage with a multimeter.",
}

HELP = ("support", "technician", "engineer", "sales", "accounts")


@staff_required(*HELP)
def search(request):
    """One box: phone, name, serial, project code, ticket code or pincode. Serial hits show the warranty at once."""
    q = request.GET.get("q", "").strip()
    customers, units, projects, tickets = [], [], [], []
    if q:
        digits = "".join(ch for ch in q if ch.isdigit())
        cq = Q(name__icontains=q) | Q(pincode=q) | Q(email__icontains=q)
        if len(digits) >= 4:
            cq |= Q(phone__contains=digits)
        customers = list(Customer.objects.filter(cq).distinct()[:12])
        units = [{"s": s, "w": warranty_state(s)} for s in
                 Serial.objects.filter(serial_no__icontains=q).select_related("product", "project__customer")[:12]]
        projects = list(Project.objects.filter(Q(code__icontains=q)).select_related("customer")[:8])
        tickets = list(Ticket.objects.filter(Q(code__icontains=q)).select_related("customer")[:8])
        # one clear hit: jump straight to what support needs
        if len(customers) == 1 and not units and not projects and not tickets and request.GET.get("go") == "1":
            return redirect(f"/app/help/customer/{customers[0].id}/")
    recent = Ticket.objects.exclude(status="closed").select_related("customer", "serial__product")[:8]
    return page(request, "backoffice/help.html", {"q": q, "customers": customers, "units": units, "projects": projects,
                                                      "tickets": tickets, "recent": recent})


@staff_required(*HELP)
def customer360(request, pk):
    c = get_object_or_404(Customer, pk=pk)
    units = [{"s": s, "w": warranty_state(s)} for s in
             Serial.objects.filter(project__customer=c, status="delivered").select_related("product", "project").order_by("project_id", "product__category")]
    projects = c.projects.all()
    balance = sum(p.balance_due_paise for p in projects if p.stage in ("installed", "completed"))
    return page(request, "backoffice/customer360.html", {
        "c": c, "units": units, "projects": projects, "tickets": c.tickets.select_related("serial__product", "assignee"),
        "balance": balance, "messages_log": c.messages.all()[:6], "can_invite": request.user.role in ("sales", "support", "accounts", "director")})


# ------------------------------------------------------------------ T14
@staff_required("support", "technician", "engineer")
def ticket_new(request):
    c = get_object_or_404(Customer, pk=request.GET.get("customer") or request.POST.get("customer") or 0)
    units = Serial.objects.filter(project__customer=c, status="delivered").select_related("product", "project").order_by("project_id", "product__category")
    if request.method == "POST":
        serial = units.filter(pk=request.POST.get("serial") or 0).first()
        ok, t = run(request, rules.open_ticket, request.user, c, serial=serial, fault_code=request.POST.get("fault_code", ""),
                    description=request.POST.get("description", ""), source=request.POST.get("source", "call"))
        if ok:
            return redirect(f"/app/help/tickets/{t.id}/")
    rows = [{"s": s, "w": warranty_state(s)} for s in units]
    return page(request, "backoffice/ticket_new.html", {"c": c, "rows": rows, "pick": request.GET.get("serial", request.POST.get("serial", "")),
                                                            "form": request.POST, "fault_hints": FAULT_HINTS})


@staff_required(*HELP)
def tickets(request):
    status = request.GET.get("status", "open")
    qs = Ticket.objects.select_related("customer", "serial__product", "assignee", "project")
    if status == "open":
        qs = qs.exclude(status="closed")
    elif status != "all":
        qs = qs.filter(status=status)
    return page(request, "backoffice/tickets.html", {
        "rows": qs[:150], "status": status,
        "tabs": [("open", "Open"), ("assigned", "Assigned"), ("resolved", "Awaiting customer"), ("reopened", "Reopened"), ("closed", "Closed"), ("all", "All")]})


@staff_required(*HELP)
def ticket_detail(request, pk):
    t = get_object_or_404(Ticket.objects.select_related("customer", "project", "serial__product", "assignee"), pk=pk)
    spares = []
    if t.serial and t.status in ("new", "assigned", "reopened"):
        spares = list(Serial.objects.filter(product=t.serial.product, status="in_stock").order_by("id")[:6])
    return page(request, "backoffice/ticket.html", {
        "t": t, "w": warranty_state(t.serial) if t.serial else None, "fault_hint": FAULT_HINTS.get(t.fault_code, ""), "fault_hints": FAULT_HINTS, "lines": t.lines.select_related("product", "serial"),
        "invoice": t.invoices.first(), "spares": spares,
        "events": t.project.timeline.filter(Q(message__contains=t.code))[:12] if t.project else [],
        "can_work": request.user.role in ("technician", "support", "engineer", "director"),
        "can_exclude": request.user.role in ("support", "engineer", "director"),
        "open": t.status in ("new", "assigned", "reopened"), "products": Product.objects.filter(active=True, tracked_by_serial=False).exclude(category="service")})


@staff_required(*HELP)
@require_POST
def ticket_do(request, pk):
    t = get_object_or_404(Ticket, pk=pk)
    post = request.POST
    action = post.get("action")
    user = request.user
    try:
        if action == "resolve":
            parts = []
            if post.get("part") and post.get("part_qty"):
                parts.append((int(post["part"]), post["part_qty"]))
            rules.resolve_ticket(user, t, notes=post.get("notes", ""), hours=post.get("hours"), fault_serial_no=post.get("fault_serial", ""),
                                 replacement_serial_no=post.get("replacement", ""), extra_parts=parts)
            messages.success(request, "Resolved. The customer has been asked to confirm that everything works.")
        elif action == "confirm":     # technician captures the customer's answer on the device
            rules.confirm_ticket(user, t, post.get("works") == "1", post.get("note", ""), rating=post.get("rating"))
            messages.success(request, "Recorded the customer's answer.")
        elif action == "close":
            rules.close_ticket(user, t, post.get("reason", ""))
            messages.success(request, "Closed by the Director.")
        elif action == "exclude" and t.serial:
            rules.set_exclusion(user, t.serial, post.get("reason", ""))
            messages.success(request, "Warranty marked as not applying to this unit.")
    except RuleError as e:
        messages.error(request, e.message)
    return redirect(f"/app/help/tickets/{t.id}/")
