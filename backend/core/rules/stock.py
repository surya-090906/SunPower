"""T0 receive stock, T9 pick and scan, T10 dispatch, T11 confirm delivery (warranty starts here)."""
from decimal import Decimal

from django.db import transaction

from .. import clock
from ..calc import stock
from ..models import (Dispatch, DispatchLine, Product, Project, PurchaseLine, PurchaseReceipt, Serial, StockMove,
                      Supplier)
from ..money import inr
from ..utils import add_months
from .common import (RuleError, log, message_customer, notify, notify_customer, post_ledger, require_role,
                     set_stage, users_with_role)


def norm_serial(raw):
    return (raw or "").strip().upper()


# ------------------------------------------------------------------ T0
@transaction.atomic
def receive_stock(actor, supplier_name, ref, lines):
    """lines: [{'product': Product, 'qty': n, 'unit_cost_paise': n, 'serials': [..]}]"""
    require_role(actor, "warehouse")
    supplier_name = (supplier_name or "").strip()
    if not supplier_name:
        raise RuleError("Enter the supplier.")
    if not lines:
        raise RuleError("Add at least one item.")
    supplier, _ = Supplier.objects.get_or_create(name=supplier_name)
    receipt = PurchaseReceipt.objects.create(supplier=supplier, ref=(ref or "").strip(), received_by=actor)
    for item in lines:
        product: Product = item["product"]
        qty = Decimal(str(item["qty"]))
        cost = int(item["unit_cost_paise"])
        if qty <= 0:
            raise RuleError(f"Quantity for {product.name} must be above zero.")
        if cost <= 0:
            raise RuleError(f"Enter the unit cost for {product.name}.")
        old_qty = stock.on_hand(product)
        pl = PurchaseLine.objects.create(receipt=receipt, product=product, qty=qty, unit_cost_paise=cost)
        if product.tracked_by_serial:
            serials = [norm_serial(s) for s in item.get("serials", []) if norm_serial(s)]
            if len(serials) != int(qty):
                raise RuleError(f"{product.name}: {len(serials)} serial numbers entered for a quantity of {int(qty)}.")
            dupes = sorted({s for s in serials if serials.count(s) > 1})
            if dupes:
                raise RuleError(f"Duplicate serial numbers in the list: {', '.join(dupes)}.")
            existing = list(Serial.objects.filter(serial_no__in=serials).values_list("serial_no", flat=True))
            if existing:
                raise RuleError(f"Already in the system: {', '.join(existing)}.")
            Serial.objects.bulk_create([
                Serial(product=product, serial_no=s, unit_cost_paise=cost, purchase_line=pl, received_at=clock.now())
                for s in serials])
        else:
            StockMove.objects.create(product=product, qty_delta=qty, reason="receipt", unit_cost_paise=cost)
        total = old_qty + qty
        product.avg_cost_paise = int((old_qty * (product.avg_cost_paise or cost) + qty * cost) / total) if total else cost
        product.cost_paise = cost
        product.save(update_fields=["avg_cost_paise", "cost_paise"])
    _release_awaiting_stock()
    return receipt


def _release_awaiting_stock():
    for d in Dispatch.objects.filter(status=Dispatch.Status.AWAITING_STOCK).order_by("id"):
        if all(stock.available(l.product, exclude_dispatch=d) >= l.qty_required for l in d.lines.select_related("product")):
            d.status = Dispatch.Status.TO_PICK
            d.save(update_fields=["status"])
            notify(users_with_role("warehouse"), f"Stock arrived for {d.project.code}", "Pick list is ready.",
                   link=f"/app/inventory/dispatch/{d.id}/")
            log(d.project, f"Stock arrived. Pick list {d.code} is ready.")


# ------------------------------------------------------------------ T9
def _refresh_dispatch_status(dispatch):
    lines = list(dispatch.lines.all())
    ready = bool(lines) and all(l.complete for l in lines)
    new = Dispatch.Status.READY if ready else Dispatch.Status.TO_PICK
    if dispatch.status in (Dispatch.Status.TO_PICK, Dispatch.Status.READY) and dispatch.status != new:
        dispatch.status = new
        dispatch.save(update_fields=["status"])


@transaction.atomic
def scan_serial(actor, dispatch, serial_no):
    require_role(actor, "warehouse")
    if dispatch.status == Dispatch.Status.AWAITING_STOCK:
        raise RuleError("This order is waiting for stock. Receive the missing items first.")
    if dispatch.status not in (Dispatch.Status.TO_PICK, Dispatch.Status.READY):
        raise RuleError("This order has already been dispatched.")
    sn = norm_serial(serial_no)
    if not sn:
        raise RuleError("Scan or type a serial number.")
    serial = Serial.objects.select_related("product", "dispatch__project").filter(serial_no=sn).first()
    if serial is None:
        raise RuleError("Serial not in stock.")
    if serial.status == Serial.Status.RESERVED:
        raise RuleError(f"Serial already scanned for {serial.dispatch.project.code}.")
    if serial.status != Serial.Status.IN_STOCK:
        raise RuleError(f"Serial is not in stock (status: {serial.get_status_display().lower()}).")
    open_lines = [l for l in dispatch.lines.select_related("product") if l.product.tracked_by_serial and not l.complete]
    line = next((l for l in open_lines if l.product_id == serial.product_id), None)
    if line is None:
        if open_lines:
            need = ", ".join(f"{int(l.remaining)} more {l.product.name}" for l in open_lines)
            raise RuleError(f"This is {serial.product.name}. This order still needs {need}.")
        raise RuleError("Every serial-tracked item for this order is already scanned.")
    serial.status = Serial.Status.RESERVED
    serial.dispatch = dispatch
    serial.project = dispatch.project
    serial.save(update_fields=["status", "dispatch", "project"])
    line.qty_picked += 1
    line.save(update_fields=["qty_picked"])
    _refresh_dispatch_status(dispatch)
    return serial, line


def scan_many(actor, dispatch, raw_text):
    """Bulk entry for panels: one serial per line (or comma/space separated). Returns (ok, errors)."""
    import re
    ok, errors = [], []
    for sn in [s for s in re.split(r"[\s,;]+", raw_text or "") if s]:
        try:
            serial, _ = scan_serial(actor, dispatch, sn)
            ok.append(serial)
        except RuleError as e:
            errors.append(f"{norm_serial(sn)}: {e.message}")
    return ok, errors


@transaction.atomic
def pack_item(actor, dispatch, line_id, qty=None):
    require_role(actor, "warehouse")
    if dispatch.status not in (Dispatch.Status.TO_PICK, Dispatch.Status.READY):
        raise RuleError("This order is not open for packing.")
    line = dispatch.lines.select_related("product").get(pk=line_id)
    if line.product.tracked_by_serial:
        raise RuleError(f"{line.product.name} must be scanned serial by serial.")
    line.qty_picked = Decimal(str(qty)) if qty is not None else line.qty_required
    if line.qty_picked > line.qty_required or line.qty_picked < 0:
        raise RuleError("Packed quantity must be between zero and the quantity required.")
    line.save(update_fields=["qty_picked"])
    _refresh_dispatch_status(dispatch)


def dispatch_progress(dispatch):
    lines = list(dispatch.lines.select_related("product"))
    tracked = [l for l in lines if l.product.tracked_by_serial]
    return {
        "tracked_required": int(sum(l.qty_required for l in tracked)),
        "tracked_picked": int(sum(l.qty_picked for l in tracked)),
        "loose_open": [l for l in lines if not l.product.tracked_by_serial and not l.complete],
    }


# ------------------------------------------------------------------ T10
@transaction.atomic
def dispatch_order(actor, dispatch, vehicle_no="", driver_name=""):
    require_role(actor, "warehouse")
    if dispatch.status != Dispatch.Status.READY:
        if dispatch.status == Dispatch.Status.AWAITING_STOCK:
            raise RuleError("This order is waiting for stock.")
        if dispatch.status in (Dispatch.Status.DISPATCHED, Dispatch.Status.DELIVERED):
            raise RuleError("This order has already been dispatched.")
        prog = dispatch_progress(dispatch)
        missing = prog["tracked_required"] - prog["tracked_picked"]
        if missing > 0:
            raise RuleError(f"{missing} of {prog['tracked_required']} serial-tracked units not scanned.")
        if prog["loose_open"]:
            raise RuleError("Mark the remaining loose items as packed: " + ", ".join(l.product.name for l in prog["loose_open"]) + ".")
        raise RuleError("This order is not ready to dispatch.")
    project = dispatch.project
    value = 0
    for s in dispatch.serials.filter(status=Serial.Status.RESERVED):
        value += s.unit_cost_paise
        s.status = Serial.Status.DISPATCHED
        s.save(update_fields=["status"])
    for line in dispatch.lines.select_related("product"):
        if not line.product.tracked_by_serial:
            unit = line.product.avg_cost_paise or line.product.cost_paise
            value += int(line.qty_picked * unit)
            StockMove.objects.create(product=line.product, qty_delta=-line.qty_picked, reason="dispatch",
                                     project=project, unit_cost_paise=unit)
    dispatch.status = Dispatch.Status.DISPATCHED
    dispatch.dispatched_at = clock.now()
    dispatch.vehicle_no = (vehicle_no or "").strip()
    dispatch.driver_name = (driver_name or "").strip()
    dispatch.truck_value_paise = value
    dispatch.save()
    post_ledger(project, "cost", "material", value, "dispatch", dispatch.id, f"Materials on {dispatch.code}")
    set_stage(project, Project.Stage.DISPATCHED)
    n = dispatch.serials.count()
    log(project, f"Dispatched {dispatch.code}: {n} serial-tracked units plus loose items, value on truck {inr(value)} at cost.",
        customer_message="Your equipment has been dispatched and is on its way.", actor=actor)
    job = getattr(project, "job", None)
    if job:
        notify([a.technician for a in job.assignments.select_related("technician")], f"Equipment dispatched: {project.code}",
               "Confirm delivery when the truck arrives.", link="/app/field/")
    notify_customer(project.customer, "Equipment on the way", dispatch.code, link=f"/portal/p/{project.id}/")
    message_customer(project, "dispatched", f"Your equipment for {project.code} is on its way.", path=f"/portal/p/{project.id}/")
    return dispatch


# ------------------------------------------------------------------ T11
@transaction.atomic
def confirm_delivery(actor, dispatch, received_by="", delivered_at=None):
    require_role(actor, "technician", "warehouse", "engineer")
    if dispatch.status != Dispatch.Status.DISPATCHED:
        raise RuleError("This order has not been dispatched, or delivery is already confirmed.")
    project = dispatch.project
    when = delivered_at or clock.now()
    start = clock.today() if delivered_at is None else when.date()
    serials = list(dispatch.serials.select_related("product"))
    for s in serials:
        months = s.product.warranty_months
        s.status = Serial.Status.DELIVERED
        s.delivered_at = when
        s.warranty_months = months
        if months:
            s.warranty_start = start
            s.warranty_end = add_months(start, months)
        s.save()
    dispatch.status = Dispatch.Status.DELIVERED
    dispatch.delivered_at = when
    dispatch.received_by = (received_by or "").strip()
    dispatch.save()
    set_stage(project, Project.Stage.DELIVERED)
    covered = sum(1 for s in serials if s.warranty_end)
    log(project, f"Delivery confirmed ({dispatch.code}). Warranty started on {covered} serial numbers.",
        customer_message="Delivered. Your warranty has started; your warranty card is ready in your account.", actor=actor)
    job = getattr(project, "job", None)
    if job:
        notify([a.technician for a in job.assignments.select_related("technician")], f"Delivered: {project.code}",
               "Equipment is on site. Ready to install.", link="/app/field/")
    notify_customer(project.customer, "Delivered: warranty started", "Your warranty card is ready", link="/portal/systems/")
    message_customer(project, "delivered", f"Your equipment for {project.code} was delivered and your warranty has started.",
                     path="/portal/systems/")
    if project.kind == Project.Kind.PANELSET:
        from .field import finish_hardware_sale
        finish_hardware_sale(project, actor)
    return dispatch
