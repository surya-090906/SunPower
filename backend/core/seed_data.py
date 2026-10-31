"""Reference data shared by the seed command and the tests: catalogue, kit templates, staff.

Prices are illustrative (Rs). Tax rates are illustrative too: verify before real invoices.
"""
import os

from .models import KitLine, KitTemplate, Product, Role, User
from .money import rupees

DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "sunthread-demo")

R = KitLine.Rule

# sku, name, category, serial?, warranty months, cost, price, tax %, unit
PRODUCTS = [
    ("PNL-540", "Mono PERC 540 Wp solar panel", "panel", True, 240, 11000, 13800, 5, "nos"),
    ("INV-1K", "Solar inverter 1 kW", "inverter", True, 24, 11500, 15000, 5, "nos"),
    ("INV-2K", "Solar inverter 2 kW", "inverter", True, 24, 17500, 22500, 5, "nos"),
    ("INV-3K", "Solar inverter 3 kW", "inverter", True, 24, 24000, 30500, 5, "nos"),
    ("INV-4K", "Solar inverter 4 kW", "inverter", True, 24, 30500, 38500, 5, "nos"),
    ("INV-5K", "Solar inverter 5 kW", "inverter", True, 24, 36000, 45500, 5, "nos"),
    ("MPPT-60", "MPPT charge controller 60 A", "charge_controller", True, 24, 6500, 9000, 5, "nos"),
    ("BATT-48-100", "48 V 100 Ah lithium battery", "battery", True, 24, 42000, 52000, 5, "nos"),
    ("STR-RCC", "GI mounting structure, RCC roof (per panel)", "structure", False, None, 1900, 2600, 5, "nos"),
    ("STR-TIN", "GI mounting structure, tin shed (per panel)", "structure", False, None, 1600, 2300, 5, "nos"),
    ("DCDB", "DC wiring box", "wiring_box", False, None, 2400, 3600, 5, "nos"),
    ("ACDB", "AC wiring box", "wiring_box", False, None, 2200, 3300, 5, "nos"),
    ("CBL-DC", "Solar DC cable 4 sq mm (pair), per metre", "cable", False, None, 90, 140, 5, "m"),
    ("CBL-AC", "AC cable 4 core 6 sq mm, per metre", "cable", False, None, 120, 180, 5, "m"),
    ("MC4", "MC4 connector pair", "connector", False, None, 120, 200, 5, "nos"),
    ("EARTH-KIT", "Earthing kit (rod, chemical, strip)", "earthing", False, None, 3200, 4800, 5, "set"),
    ("LA-KIT", "Lightning arrestor kit", "protection", False, None, 2800, 4200, 5, "set"),
    ("PROT-SET", "Isolator + MCB + SPD protection set", "protection", False, None, 2600, 3900, 5, "set"),
    ("SVC-INSTALL", "Installation and commissioning (per kW)", "service", False, None, 0, 5500, 18, "kW"),
    ("SVC-VISIT", "Service visit", "service", False, None, 0, 800, 18, "visit"),
    ("SVC-LABOUR", "Technician labour (per hour)", "service", False, None, 0, 450, 18, "h"),
]


def load_catalogue():
    products = {}
    for sku, name, cat, serial, warranty, cost, price, tax, unit in PRODUCTS:
        products[sku], _ = Product.objects.update_or_create(sku=sku, defaults=dict(
            name=name, category=cat, tracked_by_serial=serial, warranty_months=warranty, cost_paise=rupees(cost),
            avg_cost_paise=rupees(cost), price_paise=rupees(price), tax_pct=tax, unit=unit))
    for kind, label in (("ongrid", "On-Grid"), ("offgrid", "Off-Grid"), ("panelset", "Panel Set")):
        for kw in range(1, 6):
            t, _ = KitTemplate.objects.update_or_create(
                kind=kind, kw=kw, defaults=dict(name=f"{kw} kW {label}", requires_survey=kind != "panelset", active=True))
            t.lines.all().delete()
            P = products
            if kind == "panelset":
                rows = [("PNL-540", R.PER_PANEL, 1, "panel", None), ("MC4", R.PER_PANEL, 1, "", None),
                        ("CBL-DC", R.FIXED, 20, "", None)]
            else:
                rows = [
                    ("PNL-540", R.PER_PANEL, 1, "panel", None),
                    (f"INV-{kw}K", R.FIXED, 1, "inverter", None),
                    ("MPPT-60", R.FIXED, 1, "charge_controller", None),
                    ("STR-RCC", R.BY_ROOF, 1, "structure", "STR-TIN"),
                    ("DCDB", R.FIXED, 1, "wiring_box", None),
                    ("ACDB", R.FIXED, 1, "", None),
                    ("CBL-DC", R.CABLE_RUN, 1, "cable", None),
                    ("CBL-AC", R.FIXED, 15, "", None),
                    ("MC4", R.PER_PANEL, 1, "", None),
                    ("EARTH-KIT", R.FIXED, 2, "earthing", None),
                    ("LA-KIT", R.FIXED, 1, "", None),
                    ("PROT-SET", R.FIXED, 1, "protection", None),
                    ("SVC-INSTALL", R.PER_KW, 1, "service", None),
                ]
                if kind == "offgrid":
                    rows.insert(2, ("BATT-48-100", R.BATTERY, 1, "battery", None))
            for i, (sku, rule, qty, req, alt) in enumerate(rows):
                KitLine.objects.create(template=t, product=P[sku], alt_product=P[alt] if alt else None, rule=rule,
                                       qty=qty, required_category=req, sort=i)
    return products


STAFF = [
    # username, first, last, role, phone, hourly rate (Rs), can_survey, pin in demo switcher
    ("meera", "Meera", "Iyer", Role.DIRECTOR, "9845000001", 0, False, True),
    ("arjun", "Arjun", "Nair", Role.SALES, "9845000002", 0, False, True),
    ("sneha", "Sneha", "Patil", Role.SALES, "9845000003", 0, False, False),
    ("vikram", "Vikram", "Rao", Role.ENGINEER, "9845000004", 0, False, True),
    ("kiran", "Kiran", "Shetty", Role.WAREHOUSE, "9845000005", 0, False, True),
    ("divya", "Divya", "Menon", Role.SUPPORT, "9845000006", 0, False, True),
    ("rahul", "Rahul", "Gowda", Role.SUPPORT, "9845000007", 0, False, False),
    ("lakshmi", "Lakshmi", "Krishnan", Role.ACCOUNTS, "9845000008", 0, False, True),
]

TECHNICIANS = [  # first, last, hourly rate (Rs), can_survey
    ("Imran", "Khan", 280, True), ("Ravi", "Kumar", 260, True), ("Suresh", "Babu", 240, False), ("Manoj", "Reddy", 250, True),
    ("Anil", "Verma", 230, False), ("Deepak", "Joshi", 270, True), ("Farhan", "Ali", 250, False), ("Ganesh", "Pillai", 240, False),
    ("Harish", "Naik", 260, True), ("Irfan", "Sheikh", 235, False), ("Jagan", "Mohan", 245, False), ("Karthik", "S", 255, True),
    ("Lokesh", "Gowda", 240, False), ("Mahesh", "Rao", 250, False), ("Naveen", "Kumar", 265, False),
]


def load_staff():
    users = {}
    for username, first, last, role, phone, rate, survey, pin in STAFF:
        u, _ = User.objects.get_or_create(username=username, defaults=dict(
            first_name=first, last_name=last, role=role, phone=phone, hourly_rate_paise=rupees(rate), can_survey=survey,
            demo_pin=pin, email=f"{username}@sunpower.example"))
        u.set_password(DEMO_PASSWORD)
        if role == Role.DIRECTOR:
            u.is_staff = u.is_superuser = True
        u.save()
        users[username] = u
    for i, (first, last, rate, survey) in enumerate(TECHNICIANS, start=1):
        username = first.lower()
        u, _ = User.objects.get_or_create(username=username, defaults=dict(
            first_name=first, last_name=last, role=Role.TECHNICIAN, phone=f"98450100{i:02d}", hourly_rate_paise=rupees(rate),
            can_survey=survey, demo_pin=i <= 2, email=f"{username}@sunpower.example"))
        u.set_password(DEMO_PASSWORD)
        u.save()
        users[username] = u
    return users
