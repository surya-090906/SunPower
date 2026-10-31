"""The week through the real web pages, plus the customer-portal isolation checks (G13, G14, G15, G16)."""
import re
import shutil
import tempfile
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from core import clock, rules, seed_data, sim
from core.models import Customer, Dispatch, Photo, Project, Role, Serial, Ticket, User

MEDIA = tempfile.mkdtemp(prefix="sunthread-test-media-")


def login(user):
    c = Client()
    c.force_login(user)
    return c


def jpg(name="p.jpg"):
    return SimpleUploadedFile(name, b"\xff\xd8\xff\xe0" + b"0" * 64, content_type="image/jpeg")


@override_settings(MEDIA_ROOT=MEDIA)
class UIBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def tearDown(self):
        clock.unfreeze()

    def staff(self, role):
        return login(sim.actor(role))


class AnitaWeekThroughTheUI(UIBase):
    """The demo script, click by click, using only the URLs a browser would hit."""

    def test_the_whole_week(self):
        anita = Client()

        # 1. the customer sends her own enquiry, with a password, and lands in her portal
        r = anita.post("/enquire/", {
            "name": "Anita Rao", "phone": "98765 00001", "email": "anita@example.in", "address": "5, Lake View, Whitefield",
            "pincode": "560066", "segment": "home", "package": "ongrid", "kw": "3", "bill": "3400", "area": "600",
            "roof": "rcc", "load": "5", "discom": "BESCOM", "subsidy": "1", "password": "secret1",
            "site_lat": "12.9716", "site_lng": "77.5946"})
        self.assertEqual(r.status_code, 302)
        self.assertTrue(r.url.startswith("/portal/p/"), r.url)
        p = Project.objects.get(customer__phone="9876500001")
        self.assertEqual(p.source, "portal")
        self.assertEqual(p.declared["area_sqft"], 600)
        page = anita.get(f"/portal/p/{p.id}/").content.decode()
        self.assertIn("Enquiry received", page)
        self.assertIn("within 30 minutes", page)

        # 2. sales verifies on the call (customer said 600 sq ft, actually 420), survey is auto-planned
        sales = login(p.owner)
        r = sales.post(f"/app/p/{p.id}/do/qualify/", {"area": "420", "bill": "3,400", "phase": "single", "load": "5",
                                                       "discom": "BESCOM", "kw": "3", "notes": "Verified"}, follow=True)
        p.refresh_from_db()
        self.assertEqual(p.stage, "qualified")
        self.assertIn("Survey planned", r.content.decode())
        self.assertTrue(p.timeline.filter(message__contains="Customer said 600 sq ft").exists())
        self.assertIn("Site survey on", anita.get(f"/portal/p/{p.id}/").content.decode())

        # 3. the quote is blocked until the survey is approved, and the message says why
        r = sales.post(f"/app/p/{p.id}/do/quote_build/", {}, follow=True)
        self.assertIn("Survey must be approved before a quote can be created.", r.content.decode())
        self.assertFalse(p.quotes.exists())
        self.assertIn("Survey must be approved", sales.get(f"/app/p/{p.id}/?tab=quote").content.decode())

        # 4. the technician surveys on the phone: photos are uploaded one by one, then the form is submitted
        s = p.survey
        tech = login(s.assignee)
        form = {"direction": "S", "tilt": "18", "roof": "rcc", "area": "420", "cable": "35", "shading": "none", "notes": "Clear roof"}
        r = tech.post(f"/app/field/survey/{s.id}/", form, follow=True)
        self.assertIn("At least 2 photos required (0 added).", r.content.decode())
        for _ in range(2):
            up = tech.post("/app/field/photo/", {"file": jpg(), "target": "survey", "id": s.id, "kind": "roof"})
            self.assertEqual(up.json()["ok"], True)
        tech.post(f"/app/field/survey/{s.id}/", form, follow=True)
        p.refresh_from_db()
        self.assertEqual(p.stage, "survey")
        # an unrelated technician cannot upload to this survey
        other = login(User.objects.filter(role="technician").exclude(pk=s.assignee_id).first())
        self.assertEqual(other.post("/app/field/photo/", {"file": jpg(), "target": "survey", "id": s.id}).status_code, 403)

        # 5. the engineer approves; the quote unlocks
        eng = self.staff(Role.ENGINEER)
        eng.post(f"/app/p/{p.id}/do/survey_review/", {"survey": s.id, "decision": "approve"})
        p.refresh_from_db()
        self.assertEqual(p.stage, "quoting")

        # 6. quote from the template; removing the earthing kit blocks sending, restoring it unblocks
        sales.post(f"/app/p/{p.id}/do/quote_build/", {"discount": "0"})
        q = p.quotes.get()
        earthing = q.lines.get(product__sku="EARTH-KIT")
        sales.post(f"/app/p/{p.id}/do/quote_remove/", {"line": earthing.id})
        r = sales.post(f"/app/p/{p.id}/do/quote_send/", {}, follow=True)
        self.assertIn("Required parts missing: Earthing kit.", r.content.decode())
        sales.post(f"/app/p/{p.id}/do/quote_reset/", {})
        sales.post(f"/app/p/{p.id}/do/quote_send/", {})
        q.refresh_from_db()
        self.assertEqual(q.status, "sent")

        # 7. the customer reviews the quote, accepts it, and pays the advance with the demo checkout
        qpage = anita.get(f"/portal/p/{p.id}/quote/").content.decode()
        self.assertIn("Accept this quote", qpage)
        self.assertIn("Expected subsidy", qpage)
        r = anita.post(f"/portal/p/{p.id}/quote/", {"name": "Anita Rao"}, follow=True)
        self.assertIn("Tick the box", r.content.decode())
        anita.post(f"/portal/p/{p.id}/quote/", {"name": "Anita Rao", "terms": "1"})
        p.refresh_from_db()
        self.assertEqual(p.stage, "accepted")
        r = anita.post(f"/portal/p/{p.id}/pay/", {"mode": "checkout", "amount": "min"}, follow=True)
        p.refresh_from_db()
        self.assertEqual(p.stage, "ordered")
        self.assertIn("Order confirmed", r.content.decode())
        d = p.dispatches.get()
        self.assertEqual(d.status, "awaiting_stock")

        # 8. warehouse: stock arrives, scans, hits the gates, dispatches
        sim.top_up_for(p)
        wh = self.staff(Role.WAREHOUSE)
        d.refresh_from_db()
        self.assertEqual(d.status, "to_pick")
        page = wh.get(f"/app/inventory/dispatch/{d.id}/").content.decode()
        self.assertIn("serial-tracked units not scanned", page)
        battery_stock = sim.stock_up({"BATT-48-100": 1})
        bat = Serial.objects.get(product__sku="BATT-48-100", status="in_stock")
        r = wh.post(f"/app/inventory/dispatch/{d.id}/do/", {"action": "scan", "serial": bat.serial_no}, follow=True)
        self.assertIn("still needs", r.content.decode())
        r = wh.post(f"/app/inventory/dispatch/{d.id}/do/", {"action": "dispatch"}, follow=True)
        self.assertIn("not scanned", r.content.decode())
        for _ in range(8):
            wh.post(f"/app/inventory/dispatch/{d.id}/do/", {"action": "demo_next"})
        for line in d.lines.select_related("product"):
            if not line.product.tracked_by_serial:
                wh.post(f"/app/inventory/dispatch/{d.id}/do/", {"action": "pack", "line": line.id})
        d.refresh_from_db()
        self.assertEqual(d.status, "ready")
        wh.post(f"/app/inventory/dispatch/{d.id}/do/", {"action": "dispatch", "vehicle": "KA01AB1234", "driver": "Ramesh"})
        p.refresh_from_db()
        self.assertEqual(p.stage, "dispatched")
        self.assertIn("On the way", anita.get(f"/portal/p/{p.id}/").content.decode())
        self.assertEqual(anita.get(f"/doc/delivery/{d.id}/").status_code, 200)

        # 9. delivery confirmed on a technician's phone: warranty starts, her warranty card appears
        job = p.job
        crew = login(job.assignments.first().technician)
        crew.post(f"/app/field/delivery/{d.id}/", {"received_by": "Anita Rao"})
        p.refresh_from_db()
        self.assertEqual(p.stage, "delivered")
        systems = anita.get("/portal/systems/").content.decode()
        self.assertIn("Active", systems)
        self.assertEqual(anita.get(f"/doc/warranty/{p.id}/").status_code, 200)

        # 10. on the roof: the install form needs everything, then the customer signs
        form = {"started_at": "2026-10-31T08:00", "finished_at": "2026-10-31T14:00", "kw": "3", "reading": "2.6",
                "signed_by": "Anita Rao", "present": [a.technician_id for a in job.assignments.all()],
                **{k: "on" for k, _ in rules.CHECKS}}
        r = crew.post(f"/app/field/install/{job.id}/", form, follow=True)
        self.assertIn("At least 4 photos required (0 added).", r.content.decode())
        for kind in ("array", "inverter", "earthing", "display"):
            self.assertTrue(crew.post("/app/field/photo/", {"file": jpg(), "target": "job", "id": job.id, "kind": kind}).json()["ok"])
        r = crew.post(f"/app/field/install/{job.id}/", form, follow=True)
        self.assertIn("Customer signature required", r.content.decode())
        crew.post(f"/app/field/install/{job.id}/", {**form, "signature": sim.SIGNATURE})
        p.refresh_from_db()
        self.assertEqual(p.stage, "installed")
        cert = anita.get(f"/doc/handover/{p.id}/")
        self.assertEqual(cert.status_code, 200)
        self.assertIn("Anita Rao", cert.content.decode())
        self.assertIn("Pay", anita.get(f"/portal/p/{p.id}/").content.decode())

        # 11. rainy season: she raises a request herself, sees the verdict, support fixes it, she confirms
        inverter = Serial.objects.get(project=p, product__category="inverter")
        r = anita.post("/portal/requests/new/", {"serial": inverter.id, "fault_code": "E04", "description": "No power after rain"}, follow=True)
        t = Ticket.objects.get(customer=p.customer)
        self.assertIn("Covered by warranty", r.content.decode())
        spare_stock = sim.stock_up({"INV-3K": 1})
        spare = Serial.objects.filter(product__sku="INV-3K", status="in_stock").first()
        support = self.staff(Role.SUPPORT)
        support.post(f"/app/help/tickets/{t.id}/do/", {"action": "resolve", "notes": "Swapped the inverter", "hours": "2", "replacement": spare.serial_no})
        t.refresh_from_db()
        self.assertEqual(t.status, "resolved")
        r = support.post(f"/app/help/tickets/{t.id}/do/", {"action": "close", "reason": "x"}, follow=True)
        self.assertIn("Waiting for the customer's confirmation.", r.content.decode())
        anita.post(f"/portal/requests/{t.id}/confirm/", {"works": "1"})
        t.refresh_from_db()
        self.assertEqual(t.status, "closed")

        # 12. the Director sees the job and its profit, and can share a snapshot with names shortened
        boss = self.staff(Role.DIRECTOR)
        page = boss.get("/app/insights/?window=month").content.decode()
        self.assertIn("Anita Rao", page)
        r = boss.post("/app/insights/share/", {"window": "month"})
        token = r.url.split("snap=")[1]
        shared = Client().get(f"/share/{token}/").content.decode()
        self.assertIn("Anita R.", shared)
        self.assertNotIn("Anita Rao", shared)


class PortalIsolation(UIBase):
    def setUp(self):
        self.a = sim.run_to_installed(sim.enquire("Alice A", "9500000001", password="secret1"))
        self.b = sim.run_to_installed(sim.enquire("Bob B", "9500000002", password="secret1"))
        self.alice, self.bob = login(self.a.customer.user), login(self.b.customer.user)

    def test_G13_customers_cannot_see_each_others_records(self):
        b_inv = self.b.invoices.first()
        b_pay = self.b.payments.filter(status="confirmed").first()
        b_serial = Serial.objects.filter(project=self.b).first()
        for url in [f"/portal/p/{self.b.id}/", f"/portal/p/{self.b.id}/quote/", f"/portal/p/{self.b.id}/pay/", f"/doc/quote/{self.b.accepted_quote.id}/",
                    f"/doc/invoice/{b_inv.id}/", f"/doc/receipt/{b_pay.id}/", f"/doc/handover/{self.b.id}/", f"/doc/warranty/{self.b.id}/",
                    f"/doc/delivery/{self.b.dispatches.first().id}/"]:
            self.assertEqual(self.alice.get(url).status_code, 404, url)
        t = rules.open_ticket(self.b.customer.user, self.b.customer, serial=b_serial, fault_code="E1", source="portal") if b_serial.product.category != "panel" else None
        inv = Serial.objects.get(project=self.b, product__category="inverter")
        t = rules.open_ticket(self.b.customer.user, self.b.customer, serial=inv, fault_code="E1", source="portal")
        self.assertEqual(self.alice.get(f"/portal/requests/{t.id}/").status_code, 404)
        self.assertEqual(self.alice.post(f"/portal/requests/{t.id}/confirm/", {"works": "1"}).status_code, 404)
        self.assertEqual(self.alice.post(f"/portal/p/{self.b.id}/slot/install/", {"action": "confirm"}).status_code, 404)
        # raising a ticket against someone else's unit is refused
        r = self.alice.post("/portal/requests/new/", {"serial": inv.id, "fault_code": "E1"}, follow=True)
        self.assertEqual(Ticket.objects.filter(customer=self.a.customer).count(), 0)
        # and a customer cannot open any staff page
        for url in ["/app/", "/app/crm/", f"/app/p/{self.b.id}/", "/app/insights/", "/app/inventory/", "/admin/"]:
            self.assertIn(self.alice.get(url).status_code, (302, 403, 404), url)
        # anonymous visitors are sent to log in
        self.assertEqual(Client().get(f"/portal/p/{self.a.id}/").status_code, 302)
        self.assertEqual(Client().get(f"/doc/handover/{self.a.id}/").status_code, 302)

    def test_G14_portal_never_shows_costs_margins_or_internal_notes(self):
        sim.pay_balance(self.a)
        pages = [f"/portal/p/{self.a.id}/", f"/portal/p/{self.a.id}/quote/", f"/portal/p/{self.a.id}/pay/", "/portal/", "/portal/systems/",
                 f"/doc/quote/{self.a.accepted_quote.id}/", f"/doc/invoice/{self.a.invoices.first().id}/", f"/doc/handover/{self.a.id}/",
                 f"/doc/delivery/{self.a.dispatches.first().id}/", f"/doc/warranty/{self.a.id}/"]
        html = "".join(self.alice.get(u).content.decode() for u in pages)
        text = re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[^>]*>.*?</>", " ", html, flags=re.S))   # visible words only
        for secret in ("Margin", "margin", "Profit", "profit", "Ledger", "ledger", "Materials", "Labour cost", "avg cost", "unit_cost", "Est."):
            self.assertNotIn(secret, text, secret)
        # internal timeline lines (no customer_message) stay out; the customer-facing ones show
        project_page = self.alice.get(f"/portal/p/{self.a.id}/").content.decode()
        self.assertNotIn("drafted from template", project_page)
        self.assertNotIn("Pick list DN-", project_page)
        self.assertIn("Quote accepted", project_page)
        for e in self.a.timeline.filter(customer_message=""):
            self.assertNotIn(e.message, project_page)

    def test_G15_enquiry_accounts(self):
        data = {"name": "New Person", "phone": "9500000009", "address": "1 Road", "pincode": "560001", "package": "ongrid", "kw": "3",
                "site_lat": "12.9716", "site_lng": "77.5946"}
        c = Client()
        # Public signup requires a password before creating any records.
        r = c.post("/enquire/", data)
        self.assertContains(r, "Create a password to set up your customer account.")
        self.assertFalse(Customer.objects.filter(phone="9500000009").exists())
        # Staff-created customers still activate through their one-time invitation.
        p = sim.enquire("New Person", "9500000009", source="call")
        cust = p.customer
        self.assertIsNone(cust.user_id)
        # Knowing an unclaimed customer's phone does not allow signup to take it over.
        attacker = Client()
        r2 = attacker.post("/enquire/", {**data, "password": "hijack1"})
        self.assertContains(r2, "already has a customer record")
        cust.refresh_from_db()
        self.assertIsNone(cust.user_id)
        self.assertNotIn("_auth_user_id", attacker.session)
        self.assertEqual(Customer.objects.filter(phone="9500000009").count(), 1)
        self.assertNotIn(cust.claim_token, r2.content.decode())
        # the activation link sets a password and signs the customer in
        r3 = Client().post(f"/claim/{cust.claim_token}/", {"password": "secret1"})
        self.assertEqual(r3.status_code, 302)
        cust.refresh_from_db()
        self.assertIsNotNone(cust.user_id)
        self.assertEqual(Client().post(f"/claim/{cust.claim_token or 'x'}/", {"password": "again11"}).status_code, 200)
        # existing customers cannot be hijacked by enquiring with a password
        c4 = Client()
        c4.post("/enquire/", {**data, "password": "hijack1"})
        self.assertFalse(Client().login(username="9500000009", password="hijack1"))
        # login works with phone number
        self.assertTrue(Client().login(username="9500000009", password="secret1"))

    def test_G16_portal_payment_paths(self):
        p = sim.enquire("Pay Tester", "9500000010", password="secret1")
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        sim.quote(p)
        sim.accept(p)
        c = login(p.customer.user)
        r = c.post(f"/portal/p/{p.id}/pay/", {"mode": "reference", "method": "upi", "reference": "UTR998877", "amount": "min"}, follow=True)
        p.refresh_from_db()
        self.assertEqual(p.stage, "accepted")
        self.assertIn("Payment reference received", r.content.decode())
        self.assertEqual(p.payments.get().status, "pending")
        acct = self.staff(Role.ACCOUNTS)
        self.assertIn("UTR998877", acct.get("/app/accounts/").content.decode())
        acct.post(f"/app/accounts/verify/{p.payments.get().id}/", {"decision": "approve"})
        p.refresh_from_db()
        self.assertEqual(p.stage, "ordered")
        # a reference without a number is refused
        p2 = sim.enquire("Pay Tester Two", "9500000011", password="secret1")
        sim.qualify(p2)
        sim.survey(p2)
        sim.approve(p2)
        sim.quote(p2)
        sim.accept(p2)
        r = login(p2.customer.user).post(f"/portal/p/{p2.id}/pay/", {"mode": "reference", "method": "upi", "reference": "", "amount": "min"}, follow=True)
        self.assertIn("Enter the transaction or cheque reference", r.content.decode())
        self.assertFalse(p2.payments.exists())

    def test_staff_roles_are_enforced_on_pages(self):
        sales, wh, tech = self.staff(Role.SALES), self.staff(Role.WAREHOUSE), self.staff(Role.TECHNICIAN)
        self.assertEqual(wh.get("/app/insights/").status_code, 302)
        self.assertEqual(sales.get("/app/inventory/").status_code, 302)
        self.assertEqual(tech.get("/app/crm/").status_code, 302)
        d = self.a.dispatches.first()
        self.assertEqual(sales.post(f"/app/inventory/dispatch/{d.id}/do/", {"action": "dispatch"}).status_code, 302)

    def test_webhook_enquiry_needs_the_key(self):
        c = Client()
        body = {"name": "Hook Person", "phone": "9500000020", "address": "2 Road", "pincode": "560002", "package": "offgrid", "kw": 2}
        self.assertEqual(c.post("/api/enquiry/", body, content_type="application/json").status_code, 401)
        r = c.post("/api/enquiry/", body, content_type="application/json", headers={"X-API-Key": "demo-key"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["reference"].startswith("SP-"))
        self.assertEqual(Project.objects.get(customer__phone="9500000020").source, "webhook")
