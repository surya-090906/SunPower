"""The week, as tests. Each test names the blueprint gate (G1..G12, G15, G16) it proves."""
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase

from core import clock, rules, seed_data, sim
from core.calc.finance import project_financials
from core.calc.warranty import warranty_state
from core.models import (Customer, Dispatch, Invoice, LedgerEntry, Payment, Project, Role, Serial, Task, Ticket, User)
from core.money import rupees
from core.utils import add_months


class Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()

    def tearDown(self):
        clock.unfreeze()

    def assertBlocked(self, fn, *args, contains="", **kwargs):
        with self.assertRaises(rules.RuleError) as cm:
            fn(*args, **kwargs)
        if contains:
            self.assertIn(contains, cm.exception.message)
        return cm.exception


class SalesFlow(Base):
    def test_enquiry_with_password_creates_login_and_owner(self):
        res = rules.submit_enquiry(name="Anita Rao", phone="+91 98765 43210", address="5 MG Road", pincode="560001",
                                   kind="ongrid", requested_kw=3, subsidy_interest=True, password="secret1", email="a@x.in")
        p = res.project
        self.assertEqual(p.stage, "enquiry")
        self.assertIsNotNone(p.owner)
        self.assertTrue(res.user and res.customer.user_id == res.user.id)
        self.assertEqual(res.customer.phone, "9876543210")
        self.assertTrue(p.tasks.filter(kind="first_call", status="open").exists())
        self.assertTrue(p.timeline.exclude(customer_message="").exists())          # customer-visible line

    def test_enquiry_without_password_queues_activation_link(self):
        res = sim.enquire("Walk In", "9111111111", source="call")
        self.assertIsNone(res.customer.user_id)
        self.assertTrue(res.customer.claim_token)
        self.assertIn("/claim/", res.customer.messages.first().body)

    def test_G10_duplicate_phone_does_not_duplicate_customer_and_lost_needs_reason(self):
        a = sim.enquire("Dup One", "9222222222")
        b = rules.submit_enquiry(name="Dup One", phone="92222 22222", address="x street", pincode="560001", kind="ongrid")
        self.assertTrue(b.repeat)
        self.assertEqual(b.project.id, a.id)
        self.assertEqual(Customer.objects.filter(phone="9222222222").count(), 1)
        self.assertBlocked(rules.mark_lost, sim.actor(Role.SALES), a, "", contains="reason")
        rules.mark_lost(sim.actor(Role.SALES), a, "Not interested")
        a.refresh_from_db()
        self.assertEqual((a.stage, a.lost_reason), ("lost", "Not interested"))

    def test_G1_quote_blocked_before_survey_approval(self):
        p = sim.enquire()
        sim.qualify(p)
        self.assertBlocked(rules.build_quote, sim.actor(Role.SALES), p, contains="Survey must be approved")
        sim.survey(p)                     # submitted but not yet approved
        self.assertBlocked(rules.build_quote, sim.actor(Role.SALES), p, contains="Survey must be approved")
        sim.approve(p)
        q = rules.build_quote(sim.actor(Role.SALES), p)
        self.assertEqual(q.status, "draft")

    def test_qualification_fail_gives_reasons_and_keeps_stage(self):
        p = sim.enquire(kw=5)
        res = sim.qualify(p, area=200, load=3)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.reasons), 2)
        p.refresh_from_db()
        self.assertEqual(p.stage, "enquiry")
        self.assertEqual(res.max_kw, 2)

    def test_survey_needs_photos_and_engineer_must_give_reject_reason(self):
        p = sim.enquire()
        sim.qualify(p)
        s = p.survey
        self.assertBlocked(rules.submit_survey, s.assignee, s, roof_direction="S", tilt_deg=18, roof_type="rcc",
                           usable_area_sqft=400, cable_run_m=30, shading="none", contains="At least 2 photos")
        sim.survey(p)
        self.assertBlocked(rules.review_survey, sim.actor(Role.ENGINEER), p.survey, False, "", contains="reason")
        new = rules.review_survey(sim.actor(Role.ENGINEER), p.survey, False, "Photos unclear")
        p.refresh_from_db()
        self.assertEqual(p.stage, "qualified")
        self.assertEqual(new.status, "requested")

    def test_quote_lines_follow_template_and_survey(self):
        p = sim.enquire()
        sim.qualify(p)
        sim.survey(p, cable=35, roof="tin")
        sim.approve(p)
        q = rules.build_quote(sim.actor(Role.SALES), p)
        lines = {l.product.sku: l for l in q.lines.select_related("product")}
        self.assertEqual(q.panel_count, 6)
        self.assertEqual(lines["PNL-540"].qty, 6)
        self.assertEqual(lines["CBL-DC"].qty, 39)                 # 35 m + 10%
        self.assertIn("STR-TIN", lines)                           # tin roof variant
        self.assertNotIn("STR-RCC", lines)
        self.assertEqual(lines["SVC-INSTALL"].qty, 3)
        self.assertEqual(q.subsidy_paise, rupees(78000))          # 3 kW on-grid home wanting subsidy
        self.assertEqual(q.total_paise, q.subtotal_paise + q.tax_paise)

    def test_send_blocked_when_required_part_missing_unless_engineer_overrides(self):
        p = sim.enquire()
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        q = rules.build_quote(sim.actor(Role.SALES), p)
        rules.quote_remove_line(sim.actor(Role.SALES), q, q.lines.get(product__sku="EARTH-KIT").id)
        self.assertBlocked(rules.send_quote, sim.actor(Role.SALES), q, contains="Required parts missing: Earthing kit")
        self.assertBlocked(rules.send_quote, sim.actor(Role.SALES), q, "because", contains="Required parts missing")
        rules.send_quote(sim.actor(Role.ENGINEER), q, "Customer supplies own earthing")
        q.refresh_from_db()
        self.assertEqual(q.status, "sent")

    def test_discount_cap(self):
        p = sim.enquire()
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        q = rules.build_quote(sim.actor(Role.SALES), p)
        self.assertBlocked(rules.quote_set_discount, sim.actor(Role.SALES), q, 20, contains="Director")
        rules.quote_set_discount(sim.actor(Role.SALES), q, 10)
        q.refresh_from_db()
        self.assertEqual(q.discount_pct, 10)
        self.assertLess(q.subtotal_paise, q.gross_paise)

    def test_panelset_skips_survey(self):
        p = sim.enquire(kind="panelset", kw=2)
        res = rules.record_qualification(sim.actor(Role.SALES), p, notes="Hardware only")
        p.refresh_from_db()
        self.assertTrue(res.passed)
        self.assertEqual(p.stage, "quoting")
        q = rules.build_quote(sim.actor(Role.SALES), p)
        self.assertFalse(q.lines.filter(product__category="service").exists())


class OrderFlow(Base):
    def test_G2_advance_threshold_confirms_order_and_creates_work(self):
        p = sim.enquire()
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        sim.quote(p)
        sim.accept(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "accepted")
        need = p.advance_required_paise
        self.assertEqual(need, round(p.accepted_quote.total_paise * 0.30))
        r = rules.record_payment(sim.actor(Role.ACCOUNTS), p, need - 10000, "upi", "UTR1")
        p.refresh_from_db()
        self.assertFalse(r.order_confirmed)
        self.assertEqual(r.shortfall_paise, 10000)
        self.assertIn("more needed to confirm the order", r.message)
        self.assertEqual(p.stage, "accepted")
        self.assertFalse(p.dispatches.exists())
        r = rules.record_payment(sim.actor(Role.ACCOUNTS), p, 10000, "cash")
        p.refresh_from_db()
        self.assertTrue(r.order_confirmed)
        self.assertEqual(p.stage, "ordered")
        d = p.dispatches.get()
        self.assertEqual(d.status, "awaiting_stock")                       # nothing in the warehouse yet
        self.assertTrue(p.job.assignments.count() == 2)                   # 3 kW -> crew of 2
        self.assertTrue(p.job.scheduled_date >= clock.today() + timedelta(days=3))
        self.assertTrue(p.tasks.filter(kind="subsidy").count() == 6)

    def test_payment_validation_and_overpay(self):
        p = sim.run_to_ordered(sim.enquire())
        acc = sim.actor(Role.ACCOUNTS)
        self.assertBlocked(rules.record_payment, acc, p, 0, "cash", contains="above zero")
        self.assertBlocked(rules.record_payment, acc, p, 100, "upi", "", contains="reference")
        self.assertBlocked(rules.record_payment, acc, p, p.balance_due_paise + 1, "cash", contains="more than the amount due")

    def test_G16_customer_reference_stays_pending_until_verified(self):
        p = sim.enquire(password="secret1")
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        sim.quote(p)
        sim.accept(p)
        cust = p.customer.user
        r = rules.record_payment(cust, p, p.advance_required_paise, "upi", "UTR-CUST-1")
        p.refresh_from_db()
        self.assertEqual(r.payment.status, "pending")
        self.assertEqual(p.stage, "accepted")
        self.assertTrue(p.tasks.filter(kind="verify_payment", status="open").exists())
        r2 = rules.verify_payment(sim.actor(Role.ACCOUNTS), r.payment, True)
        p.refresh_from_db()
        self.assertTrue(r2.order_confirmed)
        self.assertEqual(p.stage, "ordered")

    def test_G16_demo_checkout_confirms_immediately_and_rejection_does_not(self):
        p = sim.enquire(password="secret1")
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        sim.quote(p)
        sim.accept(p)
        cust = p.customer.user
        r = rules.record_payment(cust, p, p.advance_required_paise, "upi", "BAD-REF")
        rules.verify_payment(sim.actor(Role.ACCOUNTS), r.payment, False, "No such transfer")
        p.refresh_from_db()
        self.assertEqual((p.stage, r.payment.__class__.objects.get(pk=r.payment.pk).status), ("accepted", "rejected"))
        r = rules.record_payment(cust, p, p.advance_required_paise, "online_demo")
        p.refresh_from_db()
        self.assertTrue(r.order_confirmed)

    def test_G3_dispatch_blocked_with_unscanned_serial(self):
        p = sim.run_to_ordered(sim.enquire())
        d = p.dispatches.get()
        self.assertEqual(d.status, "awaiting_stock")           # nothing in the warehouse when the order confirmed
        self.assertBlocked(rules.dispatch_order, sim.actor(Role.WAREHOUSE), d, contains="waiting for stock")
        sim.top_up_for(p)                                      # stock arrives -> the waiting order is released
        d.refresh_from_db()
        self.assertEqual(d.status, "to_pick")
        wh = sim.actor(Role.WAREHOUSE)
        err = self.assertBlocked(rules.dispatch_order, wh, d, contains="serial-tracked units not scanned")
        self.assertIn("8 of 8", err.message)                       # 6 panels + inverter + charge controller
        inv = Serial.objects.filter(product__sku="INV-3K", status="in_stock").first()
        rules.scan_serial(wh, d, inv.serial_no)
        self.assertBlocked(rules.dispatch_order, wh, d, contains="not scanned")

    def test_G4_scan_rejections(self):
        p = sim.run_to_ordered(sim.enquire())
        sim.top_up_for(p)
        sim.stock_up({"BATT-48-100": 1, "INV-5K": 1})
        d = p.dispatches.get()
        wh = sim.actor(Role.WAREHOUSE)
        battery = Serial.objects.get(product__sku="BATT-48-100")
        self.assertBlocked(rules.scan_serial, wh, d, battery.serial_no, contains="still needs")
        self.assertBlocked(rules.scan_serial, wh, d, "NOPE-123", contains="Serial not in stock")
        wrong_size = Serial.objects.get(product__sku="INV-5K")
        self.assertBlocked(rules.scan_serial, wh, d, wrong_size.serial_no, contains="Solar inverter 5 kW")
        inv = Serial.objects.filter(product__sku="INV-3K").first()
        rules.scan_serial(wh, d, inv.serial_no)
        self.assertBlocked(rules.scan_serial, wh, d, inv.serial_no.lower(), contains="already scanned for " + p.code)
        other = Serial.objects.filter(product__sku="INV-3K", status="in_stock")
        self.assertFalse(other.exists())
        self.assertBlocked(rules.scan_serial, sim.actor(Role.SALES), d, "X", contains="permission")

    def test_stock_arrival_releases_waiting_order_and_availability_is_shared(self):
        p1 = sim.run_to_ordered(sim.enquire("A One", "9300000001"))
        d1 = p1.dispatches.get()
        self.assertEqual(d1.status, "awaiting_stock")
        sim.top_up_for(p1)
        d1.refresh_from_db()
        self.assertEqual(d1.status, "to_pick")
        # a second order for the same item sees it as committed, so it must wait
        p2 = sim.run_to_ordered(sim.enquire("B Two", "9300000002"))
        d2 = p2.dispatches.get()
        self.assertEqual(d2.status, "awaiting_stock")

    def test_receive_stock_validations(self):
        from core.models import Product
        wh = sim.actor(Role.WAREHOUSE)
        inv = Product.objects.get(sku="INV-3K")
        line = lambda **kw: [{"product": inv, "qty": 2, "unit_cost_paise": 100, "serials": ["A1", "A2"], **kw}]
        self.assertBlocked(rules.receive_stock, wh, "S", "", line(serials=["A1"]), contains="serial numbers entered")
        self.assertBlocked(rules.receive_stock, wh, "S", "", line(serials=["A1", "a1"]), contains="Duplicate")
        rules.receive_stock(wh, "S", "", line())
        self.assertBlocked(rules.receive_stock, wh, "S", "", line(), contains="Already in the system")
        self.assertBlocked(rules.receive_stock, wh, "", "", line(), contains="supplier")


class DeliveryAndInstall(Base):
    def test_G5_warranty_starts_at_delivery_for_every_serial(self):
        p = sim.run_to_ordered(sim.enquire())
        sim.top_up_for(p)
        sim.dispatch(p)
        for s in Serial.objects.filter(project=p):
            self.assertEqual(s.status, "dispatched")
            self.assertIsNone(s.warranty_end)                    # not delivered yet: no clock
        sim.deliver(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "delivered")
        today = clock.today()
        panels = Serial.objects.filter(project=p, product__category="panel")
        inverter = Serial.objects.get(project=p, product__category="inverter")
        self.assertEqual(panels.count(), 6)
        for s in panels:
            self.assertEqual(s.warranty_end, add_months(today, 240))
        self.assertEqual(inverter.warranty_end, add_months(today, 24))
        self.assertEqual(Serial.objects.filter(project=p, warranty_end__isnull=True).count(), 0)
        self.assertEqual(warranty_state(inverter).state, "active")

    def test_ledger_books_material_at_dispatch(self):
        p = sim.run_to_ordered(sim.enquire())
        sim.top_up_for(p)
        sim.dispatch(p)
        d = p.dispatches.get()
        self.assertGreater(d.truck_value_paise, 0)
        mat = LedgerEntry.objects.get(project=p, category="material")
        self.assertEqual(mat.amount_paise, d.truck_value_paise)

    def test_G6_install_gates(self):
        p = sim.run_to_ordered(sim.enquire())
        tech = sim.actor(Role.TECHNICIAN)
        job = p.job
        now = clock.now()
        base = dict(started_at=now, finished_at=now + timedelta(hours=6), kw_confirmed=3,
                    checks={k: True for k, _ in rules.CHECKS}, test_reading_kw=2.5,
                    present_ids=[a.technician_id for a in job.assignments.all()], signed_by="Cust", signature=sim.SIGNATURE)
        self.assertBlocked(rules.complete_install, tech, job, contains="not been delivered", **base)
        sim.top_up_for(p)
        sim.dispatch(p)
        sim.deliver(p)
        job.refresh_from_db()
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "checks": {"check_stands": True}}, contains="Checklist incomplete")
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "finished_at": now}, contains="after the start")
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "finished_at": now + timedelta(hours=20)}, contains="14 hours")
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "kw_confirmed": 4}, contains="differs from the quoted")
        self.assertBlocked(rules.complete_install, tech, job, **base, contains="At least 4 photos required (0 added)")
        sim.add_photos(p, 2, "install", job=job)
        self.assertBlocked(rules.complete_install, tech, job, **base, contains="(2 added)")
        sim.add_photos(p, 2, "install", job=job)
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "signature": ""}, contains="Customer signature required")
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "signed_by": ""}, contains="Customer signature required")
        self.assertBlocked(rules.complete_install, tech, job, **{**base, "present_ids": []}, contains="technicians who were on site")
        rules.complete_install(tech, job, **base)
        p.refresh_from_db()
        self.assertEqual(p.stage, "installed")
        self.assertBlocked(rules.complete_install, tech, job, **base, contains="already signed off")

    def test_install_posts_revenue_labour_invoice_and_unlocks_subsidy(self):
        p = sim.run_to_installed(sim.enquire())
        fin = project_financials(p)
        self.assertFalse(fin["estimated"])
        self.assertEqual(fin["revenue"], p.contract_value_paise)
        self.assertGreater(fin["labour"], 0)
        self.assertGreater(fin["materials"], 0)
        self.assertEqual(fin["profit"], fin["revenue"] - fin["cost"])
        self.assertTrue(30 < fin["margin"] < 40 or 20 < fin["margin"] < 40, fin["margin"])
        inv = p.invoices.get(kind="final")
        self.assertEqual(inv.total_paise, p.accepted_quote.total_paise)
        self.assertEqual(inv.balance_paise, p.balance_due_paise)
        self.assertTrue(p.tasks.filter(kind="collect_balance", status="open").exists())
        self.assertFalse(p.tasks.filter(kind="subsidy", status="blocked").exists())     # unlocked by the install

    def test_T13_project_completes_only_when_paid_and_paperwork_done(self):
        p = sim.run_to_installed(sim.enquire())
        sim.pay_balance(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "installed")                   # subsidy paperwork still open
        sim.complete_subsidy(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "completed")

    def test_no_subsidy_means_complete_on_final_payment(self):
        p = sim.enquire(kind="offgrid", kw=2, subsidy=False)
        sim.run_to_installed(p)
        self.assertFalse(p.tasks.filter(kind="subsidy").exists())
        sim.pay_balance(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "completed")


class AfterSales(Base):
    def _aged_install(self, days_ago, phone="9400000001"):
        clock.freeze(clock.now() - timedelta(days=days_ago))
        p = sim.run_to_installed(sim.enquire("Aged Customer", phone, password="secret1"))
        sim.pay_balance(p)
        sim.complete_subsidy(p)
        clock.unfreeze()
        p.refresh_from_db()
        return p

    def test_G7_covered_ticket_is_free_posts_warranty_cost_and_lowers_margin(self):
        p = self._aged_install(548)                                       # ~18 months
        sim.stock_up({"INV-3K": 1})
        inv = Serial.objects.get(project=p, product__category="inverter")
        w = warranty_state(inv)
        self.assertTrue(w.covered, w)
        before = project_financials(p)
        t = rules.open_ticket(sim.actor(Role.SUPPORT), p.customer, serial=inv, fault_code="E04", source="call")
        self.assertTrue(t.covered)
        self.assertIn("No charge", t.coverage_note)
        self.assertEqual(t.status, "assigned")
        spare = Serial.objects.filter(product__sku="INV-3K", status="in_stock").first()
        rules.resolve_ticket(t.assignee, t, notes="Replaced inverter", hours=2, replacement_serial_no=spare.serial_no)
        t.refresh_from_db()
        after = project_financials(p)
        self.assertEqual(t.status, "resolved")
        self.assertFalse(Invoice.objects.filter(ticket=t).exists())          # costs the customer nothing
        self.assertTrue(all(not l.billable for l in t.lines.all()))
        warranty_cost = sum(e.amount_paise for e in LedgerEntry.objects.filter(project=p, category__startswith="warranty_"))
        self.assertGreater(warranty_cost, spare.unit_cost_paise - 1)
        self.assertEqual(before["profit"] - after["profit"], warranty_cost)  # margin drops by exactly that
        self.assertLess(after["margin"], before["margin"])
        spare.refresh_from_db()
        inv.refresh_from_db()
        self.assertEqual(inv.status, "replaced")
        self.assertEqual(spare.replaces_id, inv.id)

    def test_G12_replacement_inherits_remaining_warranty(self):
        p = self._aged_install(548, "9400000002")
        sim.stock_up({"INV-3K": 1})
        inv = Serial.objects.get(project=p, product__category="inverter")
        t = rules.open_ticket(sim.actor(Role.SUPPORT), p.customer, serial=inv, fault_code="E04")
        spare = Serial.objects.filter(product__sku="INV-3K", status="in_stock").first()
        rules.resolve_ticket(t.assignee, t, notes="Swapped", hours=1, replacement_serial_no=spare.serial_no)
        spare.refresh_from_db()
        self.assertEqual(spare.warranty_end, inv.warranty_end)
        self.assertEqual(spare.status, "delivered")
        self.assertEqual(spare.project_id, p.id)

    def test_G8_expired_unit_is_billed_automatically(self):
        p = self._aged_install(913, "9400000003")                         # ~30 months
        sim.stock_up({"INV-3K": 1})
        inv = Serial.objects.get(project=p, product__category="inverter")
        self.assertEqual(warranty_state(inv).state, "expired")
        panel = Serial.objects.filter(project=p, product__category="panel").first()
        self.assertTrue(warranty_state(panel).covered)                    # panels are still covered
        t = rules.open_ticket(sim.actor(Role.SUPPORT), p.customer, serial=inv, fault_code="E07")
        self.assertFalse(t.covered)
        self.assertIn("will be invoiced", t.coverage_note)
        spare = Serial.objects.filter(product__sku="INV-3K", status="in_stock").first()
        rules.resolve_ticket(t.assignee, t, notes="Replaced inverter", hours=2, replacement_serial_no=spare.serial_no)
        invoice = Invoice.objects.get(ticket=t)
        self.assertEqual(invoice.kind, "service")
        self.assertGreater(invoice.total_paise, 30500 * 100)
        self.assertEqual(invoice.lines.count(), 3)                         # visit + labour + replacement unit
        self.assertTrue(LedgerEntry.objects.filter(project=p, category="service", amount_paise=invoice.subtotal_paise).exists())
        self.assertTrue(LedgerEntry.objects.filter(project=p, category="service_material").exists())
        spare.refresh_from_db()
        self.assertEqual(spare.warranty_months, 24)                        # bought: fresh warranty
        self.assertGreater(spare.warranty_end, clock.today())
        # paying the service invoice
        r = rules.record_payment(sim.actor(Role.ACCOUNTS), p, invoice.total_paise, "upi", "UTRS1", invoice=invoice)
        invoice.refresh_from_db()
        self.assertEqual((invoice.status, invoice.balance_paise), ("paid", 0))

    def test_G9_ticket_needs_customer_confirmation(self):
        p = self._aged_install(300, "9400000004")
        inv = Serial.objects.get(project=p, product__category="inverter")
        t = rules.open_ticket(p.customer.user, p.customer, serial=inv, fault_code="E01", source="portal")
        self.assertEqual(t.source, "portal")
        rules.resolve_ticket(t.assignee, t, notes="Reset and re-seated connectors", hours=1)
        t.refresh_from_db()
        self.assertBlocked(rules.close_ticket, sim.actor(Role.SUPPORT), t, contains="Waiting for the customer's confirmation")
        self.assertBlocked(rules.close_ticket, sim.actor(Role.DIRECTOR), t, "", contains="reason")
        other = User.objects.create_user("c2", password="x", role="customer")
        self.assertBlocked(rules.confirm_ticket, other, t, True, contains="your own")
        rules.confirm_ticket(p.customer.user, t, False, "Still tripping")
        t.refresh_from_db()
        self.assertEqual((t.status, t.reopen_count), ("reopened", 1))
        rules.resolve_ticket(t.assignee, t, notes="Replaced MC4 connectors", hours=1)
        rules.confirm_ticket(p.customer.user, t, True)
        t.refresh_from_db()
        self.assertEqual(t.status, "closed")

    def test_ticket_validation(self):
        p = self._aged_install(100, "9400000005")
        other = sim.enquire("Someone Else", "9400000099")
        inv = Serial.objects.get(project=p, product__category="inverter")
        self.assertBlocked(rules.open_ticket, sim.actor(Role.SUPPORT), other.customer, serial=inv, fault_code="E1", contains="does not belong")
        self.assertBlocked(rules.open_ticket, sim.actor(Role.SUPPORT), p.customer, serial=inv, contains="Describe the problem")
        self.assertBlocked(rules.open_ticket, sim.actor(Role.SUPPORT), other.customer, fault_code="E1", contains="no installed system")
        stranger = User.objects.create_user("c3", password="x", role="customer")
        self.assertBlocked(rules.open_ticket, stranger, p.customer, serial=inv, fault_code="E1", contains="your own systems")
        self.assertBlocked(rules.open_ticket, sim.actor(Role.WAREHOUSE), p.customer, serial=inv, fault_code="E1", contains="permission")

    def test_exclusion_voids_warranty_and_bills(self):
        p = self._aged_install(200, "9400000006")
        inv = Serial.objects.get(project=p, product__category="inverter")
        rules.set_exclusion(sim.actor(Role.SUPPORT), inv, "Damaged by lightning")
        w = warranty_state(inv)
        self.assertEqual(w.state, "void")
        t = rules.open_ticket(sim.actor(Role.SUPPORT), p.customer, serial=inv, fault_code="E9")
        self.assertFalse(t.covered)
        self.assertIn("lightning", t.coverage_note)


class Invariants(Base):
    def test_G11_profit_is_revenue_minus_cost_through_the_job_life(self):
        p = sim.run_to_ordered(sim.enquire())
        fin = project_financials(p)
        self.assertTrue(fin["estimated"])
        sim.top_up_for(p)
        sim.dispatch(p)
        sim.deliver(p)
        sim.install(p)
        p.refresh_from_db()
        led = list(p.ledger.all())
        rev = sum(e.amount_paise for e in led if e.kind == "revenue")
        cost = sum(e.amount_paise for e in led if e.kind == "cost")
        fin = project_financials(p)
        self.assertEqual((fin["revenue"], fin["cost"], fin["profit"]), (rev, cost, rev - cost))

    def test_no_delete_endpoints_in_rules(self):
        names = [n for n in dir(rules) if n.startswith("delete")]
        self.assertEqual(names, [])

    def test_next_working_day_skips_sunday(self):
        from datetime import date
        from core.utils import next_working_day
        self.assertEqual(next_working_day(date(2026, 11, 1)), date(2026, 11, 2))     # a Sunday -> Monday


class HardwareOnly(Base):
    def test_panel_set_sale_completes_at_delivery_without_install(self):
        p = sim.enquire(kind="panelset", kw=2, subsidy=False)
        rules.record_qualification(sim.actor(Role.SALES), p, notes="Hardware only")
        sim.quote(p)
        sim.accept(p)
        sim.pay(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "ordered")
        self.assertFalse(hasattr(p, "job") and p.__class__.objects.filter(pk=p.pk, job__isnull=False).exists())
        sim.top_up_for(p)
        sim.dispatch(p)
        sim.deliver(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "installed")
        self.assertEqual(p.ledger.filter(category="contract").count(), 1)
        self.assertTrue(Serial.objects.filter(project=p, warranty_end__isnull=False).exists())
        sim.pay_balance(p)
        p.refresh_from_db()
        self.assertEqual(p.stage, "completed")
