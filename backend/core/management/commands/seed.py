"""python manage.py seed

Resets the database and loads the SunPower demo company. History is NOT inserted row by row:
every project is replayed through the real workflow rules with the clock moved back, so warranties,
ledgers, timelines and the dashboard are produced by the same code the live demo uses.
Dates are relative to now, so the demo works whenever you run it.
"""
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management import call_command
from django.core.management.base import BaseCommand

from core import clock, rules, seed_data, sim
from core.models import Customer, Notification, Project, Role, Serial, User
from core.money import inr, rupees

# Days after the enquiry at which each step happens.
OFF = dict(qualify=0.1, survey=2, approve=2.3, quote=3, accept=5, pay=6, dispatch=9, deliver=10, install=11, balance=14)
SUBSIDY_AT = [15, 19, 23, 27, 31, 35]
STEP_ORDER = ["enquiry", "qualify", "survey", "approve", "quote", "accept", "pay", "dispatch", "deliver", "install"]


class Late(Exception):
    """The next step would be in the future, so the replay stops here (the project is simply still in flight)."""


PLACEHOLDER = """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bae6fd"/><stop offset="1" stop-color="#fef3c7"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#s)"/><circle cx="660" cy="110" r="52" fill="#fbbf24"/>
<polygon points="80,470 720,470 640,250 160,250" fill="#1e3a8a"/>
<g stroke="#93c5fd" stroke-width="3" opacity=".8"><line x1="320" y1="250" x2="300" y2="470"/><line x1="480" y1="250" x2="500" y2="470"/>
<line x1="120" y1="360" x2="680" y2="360"/><line x1="140" y1="305" x2="660" y2="305"/><line x1="100" y1="415" x2="700" y2="415"/></g>
<rect x="60" y="470" width="680" height="16" fill="#475569"/><text x="400" y="560" font-family="sans-serif" font-size="26" fill="#334155" text-anchor="middle">Site photo (demo placeholder)</text></svg>"""


# name, phone, kind, kw, segment, subsidy, roof, cable, discount, hours, start_ago, target, extras
def S(name, phone, kind="ongrid", kw=3, segment="home", subsidy=True, roof="rcc", cable=32, discount=0, hours=6.5,
      start_ago=30, target="install", **extra):
    return dict(name=name, phone=phone, kind=kind, kw=kw, segment=segment, subsidy=subsidy, roof=roof, cable=cable,
                discount=discount, hours=hours, start_ago=start_ago, target=target, **extra)


def ago(days_since_install):
    return days_since_install + OFF["install"]


HISTORY = [
    # recent installs (the dashboard windows: today, this week, this month, last month, earlier)
    S("Suresh Patel", "9886000111", kw=3, hours=6.0, start_ago=ago(0.1)),
    S("Nandini Rao", "9886000112", kw=2, cable=24, hours=5.0, start_ago=ago(1)),
    S("Prakash Hegde", "9886000113", kind="offgrid", kw=3, subsidy=False, hours=8.0, start_ago=ago(3)),
    S("Kavya Shenoy", "9886000114", kw=5, cable=45, hours=9.0, start_ago=ago(4), ticket="open"),
    S("Mohammed Rafi", "9886000115", kw=3, roof="tin", start_ago=ago(6)),
    S("Geetha Raman", "9886000116", kw=4, cable=38, hours=7.5, start_ago=ago(9), ticket="resolved"),
    S("Sanjay Kulkarni", "9886000117", kind="offgrid", kw=2, subsidy=False, discount=8, hours=7.0, start_ago=ago(12)),
    S("Ananya Bhat", "9886000118", kw=3, start_ago=ago(15)),
    S("Rajesh Gupta", "9886000119", kw=5, segment="factory", subsidy=False, cable=60, discount=5, hours=10.0, start_ago=ago(18)),
    S("Leela Devi", "9886000120", kw=1, cable=18, hours=4.0, start_ago=ago(21)),
    S("Venkatesh Iyer", "9886000121", kw=3, roof="tin", start_ago=ago(25), ticket="reopened"),
    S("Shalini Menon", "9886000122", kind="offgrid", kw=3, subsidy=False, hours=8.5, start_ago=ago(29)),
    S("Harsha Vardhan", "9886000123", kw=4, cable=40, start_ago=ago(38)),
    S("Zainab Khan", "9886000124", kw=3, start_ago=ago(45), discount=4),
    S("Dr. Mahesh Kamath", "9886000125", kind="offgrid", kw=4, subsidy=False, discount=10, hours=9.0, start_ago=ago(52)),
    S("Bhaskar Naidu", "9886000126", kw=2, cable=26, start_ago=ago(61)),
    S("Ritu Sharma", "9886000127", kw=3, start_ago=ago(75)),
    S("Tarun Jain", "9886000128", kind="panelset", kw=3, subsidy=False, start_ago=ago(33), target="deliver"),
    S("Dinesh Pai", "9886000129", kw=4, start_ago=ago(300)),
    # planted cases
    S("Ramesh Kulkarni", "9886000101", kw=3, start_ago=ago(548 - 10) + 0, pin=True, note="in warranty: ~6 months left on the inverter"),
    S("Farida Sheikh", "9886000102", kind="offgrid", kw=2, subsidy=False, start_ago=ago(913 - 10), pin=True,
      note="inverter and battery out of warranty; panels still covered"),
    S("Joshi Residence", "9886000103", kind="offgrid", kw=2, subsidy=False, discount=12, hours=8.0, start_ago=ago(420),
      swap=("BATT-48-100", 90, "BAT-E12")),
    S("Pooja Hegde", "9886000104", kind="offgrid", kw=1, subsidy=False, cable=15, hours=4.5, start_ago=ago(700 - 10)),
    # in flight, one per stage
    S("Rohit Menon", "9886000131", target="enquiry", start_ago=0.014),
    S("Sunita Deshpande", "9886000132", kw=4, target="enquiry", start_ago=0.125),
    S("Imtiaz Ahmed", "9886000133", target="qualify", start_ago=0.4),
    S("Padma Shetty", "9886000134", target="survey", start_ago=OFF["survey"] + 1),
    S("Karthik Subramanian", "9886000135", target="approve", start_ago=OFF["approve"] + 1),
    S("Deepa Nair", "9886000136", target="quote", start_ago=OFF["quote"] + 3),
    S("Faisal Qureshi", "9886000137", kw=2, target="quote", start_ago=OFF["quote"] + 1),
    S("Anand Rajan", "9886000138", target="accept", start_ago=OFF["accept"] + 1, pin=True),
    S("Swati Kulkarni", "9886000139", target="accept", start_ago=OFF["accept"] + 0.5, pending_ref=True, pin=True),
    S("Rekha Pillai", "9886000142", target="dispatch", start_ago=OFF["dispatch"] + 1),
    S("Aditya Sinha", "9886000143", target="deliver", start_ago=OFF["deliver"] + 0.3),
    S("Mohan Das", "9886000144", target="install", start_ago=ago(9), leave_balance=58000),
    S("Revathi Kumar", "9886000145", target="install", start_ago=ago(16), subsidy_steps=1),
    # replayed last: orders still waiting for the warehouse must not take stock from the projects above
    S("Gopal Krishna", "9886000140", target="pay", start_ago=OFF["pay"] + 2),
    S("Vinod Menon", "9886000141", kw=5, cable=48, target="pay", start_ago=OFF["pay"] + 1, no_stock=("INV-5K",)),
]


class Command(BaseCommand):
    help = "Reset the database and load the SunPower demo company (history replayed through the real rules)."

    def add_arguments(self, parser):
        parser.add_argument("--keep", action="store_true", help="Do not flush existing data first")
        parser.add_argument("--only", help="Replay only the history entry whose name contains this text (debugging)")

    # ------------------------------------------------------------------ helpers
    def goto(self, start, offset_days):
        when = start + timedelta(days=offset_days)
        if when > self.real_now:
            raise Late()
        clock.freeze(when)

    def make_login(self, customer, pin=False):
        if customer.user_id:
            return customer.user
        first, _, last = customer.name.partition(" ")
        user = User.objects.create(username=customer.phone, first_name=first, last_name=last, phone=customer.phone,
                                   email=f"{customer.phone}@example.in", role=Role.CUSTOMER, demo_pin=pin,
                                   password=self.hashed)
        customer.user, customer.claim_token, customer.claimed_at = user, "", clock.now()
        customer.save()
        return user

    def play(self, spec):
        start = self.real_now - timedelta(days=spec["start_ago"])
        target = spec["target"]
        clock.freeze(start)
        p = sim.enquire(spec["name"], spec["phone"], kind=spec["kind"], kw=spec["kw"], segment=spec["segment"],
                        subsidy=spec["subsidy"], area_sqft=spec["kw"] * 130, monthly_bill=2400 + spec["kw"] * 700,
                        source="portal")
        stop_after = STEP_ORDER.index(target)
        try:
            if stop_after < 1:
                return p
            self.goto(start, OFF["qualify"])
            if spec["kind"] == "panelset":
                rules.record_qualification(sim.actor(Role.SALES), p, notes="Hardware only")
            else:
                sim.qualify(p, area=spec["kw"] * 130, bill=2400 + spec["kw"] * 700, load=max(5, spec["kw"]))
            if spec["kind"] != "panelset":
                if stop_after < 2:
                    return p
                self.goto(start, OFF["survey"])
                sim.survey(p, roof=spec["roof"], cable=spec["cable"], area=spec["kw"] * 130)
                if stop_after < 3:
                    return p
                self.goto(start, OFF["approve"])
                sim.approve(p)
            if stop_after < 4:
                return p
            self.goto(start, OFF["quote"])
            sim.quote(p, discount=spec["discount"])
            if stop_after < 5:
                return p
            self.goto(start, OFF["accept"])
            customer_user = self.make_login(p.customer, spec.get("pin", False))
            sim.accept(p)
            p.refresh_from_db()
            if spec.get("pending_ref"):
                rules.record_payment(customer_user, p, p.advance_required_paise, "upi", "UPI-8841-2207")
                return p
            if stop_after < 6:
                return p
            self.goto(start, OFF["pay"])
            sim.pay(p)
            p.refresh_from_db()
            if stop_after < 7:
                return p
            self.goto(start, OFF["dispatch"])
            sim.top_up_for(p, skip=spec.get("no_stock", ()))
            sim.dispatch(p)
            if stop_after < 8:
                return p
            self.goto(start, OFF["deliver"])
            sim.deliver(p)
            if stop_after < 9:
                return p
            self.goto(start, OFF["install"])
            sim.install(p, hours=spec["hours"])
            p.refresh_from_db()
            self.after_install(p, spec, start)
        except Late:
            pass
        finally:
            p.refresh_from_db()
        return p

    def after_install(self, p, spec, start):
        if spec["kind"] == "panelset":
            return
        if spec.get("leave_balance"):
            self.goto(start, OFF["install"] + 1)
            interim = p.balance_due_paise - rupees(spec["leave_balance"])
            if interim > 0:
                rules.record_payment(sim.actor(Role.ACCOUNTS), p, interim, "bank", "NEFT-441-9")
            return
        self.goto(start, OFF["balance"])
        sim.pay_balance(p)
        steps = spec.get("subsidy_steps")
        tasks = list(p.tasks.filter(kind="subsidy").order_by("seq"))
        for i, task in enumerate(tasks):
            if steps is not None and i >= steps:
                break
            self.goto(start, SUBSIDY_AT[i])
            rules.complete_task(sim.actor(Role.ACCOUNTS), task)

    def warranty_swap(self, project, sku, days_ago, fault):
        clock.freeze(self.real_now - timedelta(days=days_ago))
        sim.stock_up({sku: 1})
        broken = Serial.objects.filter(project=project, product__sku=sku, status="delivered").first()
        ticket = rules.open_ticket(sim.actor(Role.SUPPORT), project.customer, serial=broken, fault_code=fault, source="call")
        clock.advance(days=1)
        spare = Serial.objects.filter(product__sku=sku, status="in_stock").order_by("-id").first()
        rules.resolve_ticket(ticket.assignee, ticket, notes="Faulty unit replaced under warranty", hours=2.5,
                             replacement_serial_no=spare.serial_no)
        clock.advance(hours=4)
        rules.confirm_ticket(project.customer.user, ticket, True)

    def tickets_for(self, project, mode):
        user = self.make_login(project.customer)
        inverter = Serial.objects.filter(project=project, product__category="inverter", status="delivered").first()
        clock.freeze(self.real_now - timedelta(hours=20 if mode == "open" else 30))
        t = rules.open_ticket(user if mode == "open" else sim.actor(Role.SUPPORT), project.customer, serial=inverter,
                              fault_code="E04" if mode != "reopened" else "E12",
                              description="Inverter shows a fault code and the output has dropped to zero after the rain.",
                              source="portal" if mode == "open" else "call")
        if mode == "open":
            return
        clock.advance(hours=8)
        rules.resolve_ticket(t.assignee, t, notes="Cleaned and re-seated the DC connectors; ran a generation test.", hours=1.5)
        if mode == "reopened":
            clock.advance(hours=6)
            rules.confirm_ticket(user, t, False, "Tripped again in the evening")

    # ------------------------------------------------------------------ main
    def handle(self, *args, **opts):
        self.real_now = clock.now()
        self.hashed = make_password(seed_data.DEMO_PASSWORD)
        call_command("migrate", verbosity=0, interactive=False)
        if not opts["keep"]:
            call_command("flush", verbosity=0, interactive=False)
        media = Path(settings.MEDIA_ROOT) / "seed"
        media.mkdir(parents=True, exist_ok=True)
        (media / "placeholder.svg").write_text(PLACEHOLDER, encoding="utf-8")

        seed_data.load_catalogue()
        seed_data.load_staff()
        sim.stock_up({"PNL-540": 20, "INV-3K": 2})   # opening stock before history starts
        history = [s for s in HISTORY if not opts["only"] or opts["only"].lower() in s["name"].lower()]
        projects = {}
        for i, spec in enumerate(history, start=1):
            p = self.play(spec)
            projects[spec["name"]] = (p, spec)
            clock.unfreeze()
            self.stdout.write(f"  {i:>2}/{len(history)} {spec['name']:<22} -> {p.stage}")

        for name, (p, spec) in projects.items():
            if p.stage in ("installed", "completed", "delivered") and spec.get("swap"):
                sku, days_ago, fault = spec["swap"]
                self.make_login(p.customer)
                self.warranty_swap(p, sku, days_ago, fault)
                clock.unfreeze()
            if spec.get("ticket") and p.stage in ("installed", "completed"):
                self.tickets_for(p, spec["ticket"])
                clock.unfreeze()
            if spec.get("pin") or spec["name"] in ("Ramesh Kulkarni", "Farida Sheikh"):
                self.make_login(p.customer, pin=True)

        clock.unfreeze()
        # Today's stock. Deliberately NO 5 kW inverters, so the order waiting on them shows a shortage.
        sim.stock_up({"PNL-540": 30, "INV-1K": 3, "INV-2K": 3, "INV-3K": 4, "INV-4K": 3, "MPPT-60": 10, "BATT-48-100": 4,
                      "STR-RCC": 40, "STR-TIN": 20, "DCDB": 15, "ACDB": 15, "CBL-DC": 400, "CBL-AC": 300, "MC4": 60,
                      "EARTH-KIT": 30, "LA-KIT": 15, "PROT-SET": 15})
        # History generated a lot of old notifications: mark everything older than two days as read.
        Notification.objects.filter(created_at__lt=clock.now() - timedelta(days=2)).update(read_at=clock.now())

        self.stdout.write(self.style.SUCCESS(
            f"\nSeeded {Project.objects.count()} projects, {Customer.objects.count()} customers, "
            f"{Serial.objects.count()} serial numbers, ledger rows: {sum(p.ledger.count() for p in Project.objects.all())}."))
        self.stdout.write("Staff logins: meera (director), arjun (sales), vikram (engineer), kiran (warehouse), divya (support), "
                          "lakshmi (accounts), imran / ravi (technicians).")
        self.stdout.write("Customer logins use the phone number, e.g. 9886000101 (Ramesh), 9886000102 (Farida), 9886000138 (Anand).")
        self.stdout.write("All accounts share DEMO_PASSWORD (see .env.example). Anita Rao is not seeded: enquire live.")
