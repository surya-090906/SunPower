"""Drives the real workflow rules with sensible sample inputs.

The seed command uses this to replay months of history (with the clock moved back), and the tests use
it to walk a customer through the whole week. It never bypasses a rule: every step is a rule call.
"""
from datetime import timedelta

from . import clock, rules
from .calc import stock
from .models import Photo, Product, Project, Role, User
from .money import rupees

PLACEHOLDER_PHOTO = "seed/placeholder.svg"
SIGNATURE = ("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='100'>"
             "<path d='M10 70 C 40 10, 70 90, 100 40 S 160 20, 190 60 S 250 80, 290 30' fill='none' stroke='black' stroke-width='3'/></svg>")


def actor(role):
    return User.objects.filter(role=role, is_active=True).order_by("id").first()


def enquire(name="Test Customer", phone="9000000001", kind="ongrid", kw=3, segment="home", subsidy=True, password="",
            source="portal", pincode="560066", **declared):
    res = rules.submit_enquiry(
        name=name, phone=phone, address="12, Lake View Road, Whitefield, Bengaluru", pincode=pincode, kind=kind,
        segment=segment, requested_kw=kw, subsidy_interest=subsidy, declared=declared, password=password, source=source,
        actor=None if source == "portal" else actor(Role.SALES), city="Bengaluru")
    return res.project


def qualify(project, area=420, bill=3400, load=5, discom="BESCOM", phase="single"):
    return rules.record_qualification(
        actor(Role.SALES), project, area_sqft=area, bill_paise=rupees(bill), phase=phase, load_kw=load, discom=discom,
        notes="Verified on call")


def add_photos(project, n, kind, **link):
    for _ in range(n):
        Photo.objects.create(project=project, kind=kind, file=PLACEHOLDER_PHOTO, **link)


def survey(project, direction="S", tilt=18, roof="rcc", cable=35, shading="none", area=420, photos=2):
    s = project.survey
    add_photos(project, photos, "survey", survey=s)
    tech = s.assignee or actor(Role.TECHNICIAN)
    rules.submit_survey(tech, s, roof_direction=direction, tilt_deg=tilt, roof_type=roof, usable_area_sqft=area,
                        cable_run_m=cable, shading=shading)
    return s


def approve(project):
    return rules.review_survey(actor(Role.ENGINEER), project.survey, True)


def quote(project, discount=0, send=True):
    q = rules.build_quote(actor(Role.SALES), project, discount_pct=discount)
    if send:
        rules.send_quote(actor(Role.SALES), q)
    return q


def accept(project, name=None):
    q = project.quotes.get(status="sent")
    return rules.accept_quote(project.customer.user, q, name or project.customer.name)


def pay(project, amount_paise=None, method="upi", reference=None):
    amount = amount_paise or project.advance_required_paise
    return rules.record_payment(actor(Role.ACCOUNTS), project, amount, method, reference or f"UTR{project.id:06d}")


def serial_no(product):
    base = product.sku.replace("-", "")
    n = product.serials.count() + 1
    from .models import Serial
    while Serial.objects.filter(serial_no=f"{base}-{n:06d}").exists():
        n += 1
    return f"{base}-{n:06d}"


def stock_up(items):
    """items: {sku: qty}. Receives stock through T0 with generated serial numbers."""
    lines = []
    for sku, qty in items.items():
        p = Product.objects.get(sku=sku)
        serials = []
        if p.tracked_by_serial:
            base = p.serials.count()
            from .models import Serial
            made = 0
            while made < qty:
                s = f"{p.sku.replace('-', '')}-{base + made + 1:06d}"
                if not Serial.objects.filter(serial_no=s).exists():
                    serials.append(s)
                    made += 1
                else:
                    base += 1
        lines.append({"product": p, "qty": qty, "unit_cost_paise": p.cost_paise, "serials": serials})
    return rules.receive_stock(actor(Role.WAREHOUSE), "SolarTech Distributors", f"PO-{clock.today():%y%m%d}", lines)


def top_up_for(project, skip=()):
    """Receive whatever this order is short of (so the flow can run), except products in `skip`."""
    need = {}
    for dl in project.dispatches.order_by("-id").first().lines.select_related("product"):
        if dl.product.sku in skip:
            continue
        short = dl.qty_required - stock.available(dl.product, exclude_dispatch=dl.dispatch)
        if short > 0:
            need[dl.product.sku] = int(short)
    if need:
        stock_up(need)


def dispatch(project, vehicle="KA01AB1234", driver="Ramesh"):
    d = project.dispatches.order_by("-id").first()
    wh = actor(Role.WAREHOUSE)
    for line in d.lines.select_related("product"):
        if line.product.tracked_by_serial:
            from .models import Serial
            sns = list(Serial.objects.filter(product=line.product, status="in_stock").order_by("id")
                       .values_list("serial_no", flat=True)[: int(line.remaining)])
            for sn in sns:
                rules.scan_serial(wh, d, sn)
        else:
            rules.pack_item(wh, d, line.id)
    d.refresh_from_db()
    return rules.dispatch_order(wh, d, vehicle, driver)


def deliver(project, received_by=None):
    d = project.dispatches.order_by("-id").first()
    return rules.confirm_delivery(actor(Role.TECHNICIAN), d, received_by or project.customer.name)


def install(project, hours=6.5, kw=None, photos=4, signature=SIGNATURE, signer=None, checks=True, note=""):
    job = project.job
    add_photos(project, photos, "install", job=job)
    start = clock.now()
    return rules.complete_install(
        actor(Role.TECHNICIAN), job, started_at=start, finished_at=start + timedelta(hours=hours),
        kw_confirmed=kw or project.accepted_quote.kw, kw_note=note,
        checks={k: checks for k, _ in rules.CHECKS}, test_reading_kw=2.6,
        present_ids=[a.technician_id for a in job.assignments.all()], signed_by=signer or project.customer.name,
        signature=signature, geo_lat="12.969800", geo_lng="77.750000")


def pay_balance(project, method="upi"):
    return rules.record_payment(actor(Role.ACCOUNTS), project, project.balance_due_paise, method, f"UTRB{project.id:05d}")


def complete_subsidy(project):
    for t in project.tasks.filter(kind="subsidy").order_by("seq"):
        rules.complete_task(actor(Role.ACCOUNTS), t)


def run_to_ordered(project, **kw):
    """Enquiry -> qualified -> surveyed -> approved -> quoted -> accepted -> advance paid (order confirmed)."""
    qualify(project, **{k: v for k, v in kw.items() if k in ("area", "bill", "load", "discom", "phase")})
    survey(project, **{k: v for k, v in kw.items() if k in ("direction", "tilt", "roof", "cable", "shading")})
    approve(project)
    quote(project, discount=kw.get("discount", 0))
    accept(project)
    pay(project)
    project.refresh_from_db()
    return project


def run_to_delivered(project, **kw):
    run_to_ordered(project, **kw)
    top_up_for(project)
    dispatch(project)
    deliver(project)
    project.refresh_from_db()
    return project


def run_to_installed(project, **kw):
    run_to_delivered(project, **kw)
    install(project)
    project.refresh_from_db()
    return project
