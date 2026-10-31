"""Inventory: stock overview, receive stock (T0), serial explorer, pick/scan/dispatch (T9, T10), delivery (T11)."""
from django.conf import settings
from django.contrib import messages
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from core import rules
from core.calc import stock
from core.calc.warranty import warranty_state
from core.forms import to_paise
from core.models import Dispatch, Product, PurchaseReceipt, Serial
from core.rules import RuleError

from .utils import run, staff_required

WAREHOUSE = ("warehouse", "engineer", "accounts")


@staff_required(*WAREHOUSE)
def overview(request):
    rows = stock.stock_table()
    return render(request, "backoffice/inventory.html", {
        "rows": rows, "shortages": stock.shortages(), "value": sum(r["value_paise"] for r in rows),
        "receipts": PurchaseReceipt.objects.select_related("supplier").prefetch_related("lines__product")[:6],
        "awaiting": Dispatch.objects.filter(status="awaiting_stock").select_related("project__customer")})


@staff_required("warehouse")
def receive(request):
    products = Product.objects.filter(active=True).exclude(category="service")
    if request.method == "POST":
        product = get_object_or_404(products, pk=request.POST.get("product"))
        serials = [s for s in request.POST.get("serials", "").replace(",", "\n").splitlines() if s.strip()]
        try:
            qty = int(float(request.POST.get("qty") or 0))
        except ValueError:
            qty = 0
        ok, rec = run(request, rules.receive_stock, request.user, request.POST.get("supplier", ""), request.POST.get("ref", ""),
                      [{"product": product, "qty": qty, "unit_cost_paise": to_paise(request.POST.get("cost")) or 0, "serials": serials}],
                      ok=f"Received {qty} × {product.name}.")
        if ok:
            return redirect("/app/inventory/receive/")
    return render(request, "backoffice/receive.html", {
        "products": products, "form": request.POST,
        "receipts": PurchaseReceipt.objects.select_related("supplier").prefetch_related("lines__product")[:8]})


@staff_required("warehouse", "support", "engineer", "accounts")
def serials(request):
    q = request.GET.get("q", "").strip()
    qs = Serial.objects.select_related("product", "project__customer")
    if q:
        qs = qs.filter(Q(serial_no__icontains=q) | Q(product__name__icontains=q) | Q(project__code__icontains=q)
                       | Q(project__customer__name__icontains=q) | Q(project__customer__phone__icontains=q))
    status = request.GET.get("status", "")
    if status:
        qs = qs.filter(status=status)
    return render(request, "backoffice/serials.html", {
        "q": q, "status": status, "statuses": Serial.Status.choices,
        "rows": [{"s": s, "w": warranty_state(s)} for s in qs.order_by("-id")[:120]]})


@staff_required("warehouse", "support", "engineer", "accounts")
def serial_detail(request, pk):
    s = get_object_or_404(Serial.objects.select_related("product", "project__customer", "dispatch", "purchase_line__receipt__supplier"), pk=pk)
    history = []
    if s.purchase_line:
        r = s.purchase_line.receipt
        history.append((r.received_at, f"Received from {r.supplier.name}" + (f" (ref {r.ref})" if r.ref else "")))
    else:
        history.append((s.received_at, "Received into stock"))
    if s.dispatch:
        history.append((s.dispatch.created_at, f"Picked for {s.dispatch.code} ({s.project.code})"))
        if s.dispatch.dispatched_at:
            history.append((s.dispatch.dispatched_at, f"Dispatched on {s.dispatch.code}"))
    if s.delivered_at:
        history.append((s.delivered_at, f"Delivered to {s.project.customer.name}" if s.project else "Delivered"))
    if s.replaces_id:
        history.append((s.delivered_at, f"Installed as a replacement for {s.replaces.serial_no}"))
    for t in s.tickets.all():
        history.append((t.created_at, f"Ticket {t.code}: {t.fault_code or t.description[:50]} ({t.get_status_display().lower()})"))
    replaced_by = getattr(s, "replaced_by", None)
    if replaced_by:
        history.append((replaced_by.delivered_at, f"Replaced by {replaced_by.serial_no}"))
    history.sort(key=lambda x: x[0] or s.received_at)
    return render(request, "backoffice/serial.html", {"s": s, "w": warranty_state(s), "history": history})


@staff_required("warehouse", "engineer")
def dispatch_list(request):
    status = request.GET.get("status", "open")
    qs = Dispatch.objects.select_related("project__customer").prefetch_related("lines")
    if status == "open":
        qs = qs.filter(status__in=["awaiting_stock", "to_pick", "ready"])
    elif status in dict(Dispatch.Status.choices):
        qs = qs.filter(status=status)
    return render(request, "backoffice/dispatches.html", {
        "rows": qs[:100], "status": status, "statuses": [("open", "Open"), ("dispatched", "On the road"), ("delivered", "Delivered")]})


@staff_required("warehouse", "engineer")
def dispatch_detail(request, pk):
    d = get_object_or_404(Dispatch.objects.select_related("project__customer"), pk=pk)
    prog = rules.dispatch_progress(d)
    lines = list(d.lines.select_related("product"))
    picked = {}
    for s in d.serials.select_related("product").order_by("serial_no"):
        picked.setdefault(s.product_id, []).append(s.serial_no)
    for l in lines:
        l.serials_picked = picked.get(l.product_id, [])
        l.short = max(l.qty_required - stock.available(l.product, exclude_dispatch=d), 0) if d.status == "awaiting_stock" else 0
    gate = ""
    if d.status == "to_pick":
        missing = prog["tracked_required"] - prog["tracked_picked"]
        gate = (f"{missing} of {prog['tracked_required']} serial-tracked units not scanned." if missing > 0
                else "Mark the remaining loose items as packed: " + ", ".join(l.product.name for l in prog["loose_open"]) + ".")
    pct = int(100 * prog["tracked_picked"] / prog["tracked_required"]) if prog["tracked_required"] else 100
    return render(request, "backoffice/dispatch.html", {
        "d": d, "lines": lines, "prog": prog, "gate": gate, "pct": pct, "demo": settings.DEMO_MODE,
        "can_pick": request.user.role in ("warehouse", "director")})


@staff_required("warehouse", "engineer")
@require_POST
def dispatch_do(request, pk):
    d = get_object_or_404(Dispatch, pk=pk)
    post = request.POST
    action = post.get("action")
    user = request.user
    try:
        if action == "scan":
            serial, line = rules.scan_serial(user, d, post.get("serial", ""))
            messages.success(request, f"{serial.product.name} scanned ({int(line.qty_picked)} of {int(line.qty_required)}).")
        elif action == "bulk":
            ok, errors = rules.scan_many(user, d, post.get("bulk", ""))
            if ok:
                messages.success(request, f"{len(ok)} serial numbers scanned.")
            for e in errors[:6]:
                messages.error(request, e)
        elif action == "pack":
            rules.pack_item(user, d, int(post.get("line", 0)))
            messages.success(request, "Marked as packed.")
        elif action == "demo_next" and settings.DEMO_MODE:
            for line in d.lines.select_related("product"):
                if line.product.tracked_by_serial and not line.complete:
                    nxt = Serial.objects.filter(product=line.product, status="in_stock").order_by("id").first()
                    if nxt is None:
                        raise RuleError(f"No {line.product.name} in stock.")
                    serial, line = rules.scan_serial(user, d, nxt.serial_no)
                    messages.success(request, f"{serial.product.name} scanned ({int(line.qty_picked)} of {int(line.qty_required)}).")
                    break
            else:
                messages.info(request, "Every serial-tracked unit is already scanned.")
        elif action == "dispatch":
            rules.dispatch_order(user, d, post.get("vehicle", ""), post.get("driver", ""))
            messages.success(request, f"{d.code} dispatched. The customer has been notified.")
        elif action == "deliver":
            rules.confirm_delivery(user, d, post.get("received_by", ""))
            messages.success(request, "Delivery confirmed. Warranty has started on every serial number.")
        else:
            raise Http404()
    except RuleError as e:
        messages.error(request, e.message)
    return redirect(f"/app/inventory/dispatch/{d.id}/")
