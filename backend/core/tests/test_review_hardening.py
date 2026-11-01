"""Regression tests for the /review security findings (demo-mode takeover, free checkout, uploads, setup_real_db, ticket forging).

Regression: review-2026-11-01 findings 1-5.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import Client, TestCase, override_settings

from core import rules, seed_data, sim
from core.models import Payment, Photo, Role, Serial, Ticket, User

BACKEND = Path(__file__).resolve().parents[2]
MEDIA = tempfile.mkdtemp(prefix="sunthread-hardening-media-")


def client_for(user):
    c = Client()
    c.force_login(user)
    return c


class DemoModeDefaults(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()

    def test_demo_switch_rejects_users_not_listed_in_the_switcher(self):
        hidden = User.objects.create_user(username="hidden_admin", password="x", role=Role.DIRECTOR, is_staff=True,
                                          is_superuser=True, demo_pin=False)
        c = Client()
        c.post("/demo/switch/", {"user": hidden.pk})
        self.assertNotIn("_auth_user_id", c.session)

    def test_demo_mode_and_webhook_key_default_off_when_debug_is_off(self):
        code = ("import json, os; from sunthread import settings as s; "
                "print(json.dumps([s.DEBUG, s.DEMO_MODE, getattr(s, 'ENQUIRY_API_KEY', '<unset>')]))")
        env = {k: v for k, v in os.environ.items() if k not in ("DEMO_MODE", "ENQUIRY_API_KEY")}
        env["DEBUG"] = "0"
        out = subprocess.run([sys.executable, "-I", "-c", f"import sys; sys.path.insert(0, {str(BACKEND)!r}); {code}"],
                             capture_output=True, text=True, env=env, cwd=BACKEND, timeout=60)
        self.assertEqual(json.loads(out.stdout.strip().splitlines()[-1]), [False, False, ""], out.stderr)

    def test_webhook_refuses_every_request_when_no_key_is_configured(self):
        with override_settings(ENQUIRY_API_KEY=""):
            r = Client().post("/api/enquiry/", data="{}", content_type="application/json")
        self.assertEqual(r.status_code, 401)


class CheckoutIsDemoOnly(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()
        p = sim.enquire("Pay Tester", "9600000071", password="test-pass")
        sim.qualify(p)
        sim.survey(p)
        sim.approve(p)
        sim.quote(p)
        sim.accept(p)
        cls.project = p

    @override_settings(DEMO_MODE=False)
    def test_customer_cannot_self_confirm_a_payment_outside_demo_mode(self):
        c = client_for(self.project.customer.user)
        c.post(f"/portal/p/{self.project.pk}/pay/", {"mode": "checkout"})
        self.assertFalse(Payment.objects.filter(project=self.project, status=Payment.Status.CONFIRMED).exists())

    @override_settings(DEMO_MODE=True)
    def test_demo_checkout_still_works_in_demo_mode(self):
        c = client_for(self.project.customer.user)
        c.post(f"/portal/p/{self.project.pk}/pay/", {"mode": "checkout"})
        self.assertTrue(Payment.objects.filter(project=self.project, status=Payment.Status.CONFIRMED).exists())


@override_settings(MEDIA_ROOT=MEDIA)
class UploadsAreValidated(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()
        cls.project = sim.enquire("Upload Tester", "9600000072", password="test-pass")

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def test_portal_document_with_active_content_extension_is_rejected(self):
        c = client_for(self.project.customer.user)
        evil = SimpleUploadedFile("bill.html", b"<script>alert(1)</script>", content_type="image/png")
        c.post(f"/portal/p/{self.project.pk}/upload/", {"doc_type": "bill", "file": evil})
        self.assertFalse(Photo.objects.filter(project=self.project, kind__startswith="subsidy_").exists())

    def test_portal_document_type_must_be_one_of_the_listed_choices(self):
        c = client_for(self.project.customer.user)
        ok = SimpleUploadedFile("bill.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        c.post(f"/portal/p/{self.project.pk}/upload/", {"doc_type": "x" * 40, "file": ok})
        self.assertFalse(Photo.objects.filter(project=self.project).exists())

    def test_portal_pdf_for_a_listed_type_is_accepted(self):
        c = client_for(self.project.customer.user)
        ok = SimpleUploadedFile("bill.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        c.post(f"/portal/p/{self.project.pk}/upload/", {"doc_type": "bill", "file": ok})
        self.assertEqual(Photo.objects.filter(project=self.project, kind="subsidy_bill").count(), 1)

    def test_field_photo_with_spoofed_image_content_type_is_rejected(self):
        sim.qualify(self.project)
        survey = self.project.survey
        c = client_for(survey.assignee)
        evil = SimpleUploadedFile("site.svg", b"<svg onload=alert(1)>", content_type="image/png")
        r = c.post("/app/field/photo/", {"target": "survey", "id": survey.pk, "kind": "roof", "file": evil})
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Photo.objects.filter(survey=survey).exists())


class SetupRealDbIsGuarded(TestCase):
    def test_refuses_to_wipe_a_database_that_has_data_without_explicit_flag(self):
        User.objects.create_user(username="existing", password="x", role=Role.SALES)
        with self.assertRaises(CommandError):
            call_command("setup_real_db", "--no-backup", verbosity=0)
        self.assertTrue(User.objects.filter(username="existing").exists())

    def test_no_published_default_password_in_the_command(self):
        source = (BACKEND / "core" / "management" / "commands" / "setup_real_db.py").read_text(encoding="utf-8")
        self.assertNotIn("SunPower@2026!", source)


class OnlyServiceRolesCanRecordCustomerAnswers(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()
        cls.project = sim.run_to_installed(sim.enquire("Ticket Tester", "9600000073", password="test-pass"))
        unit = Serial.objects.filter(project=cls.project, product__category="inverter", status="delivered").first()
        cls.ticket = rules.open_ticket(sim.actor(Role.SUPPORT), cls.project.customer, serial=unit, fault_code="E04", source="call")
        rules.resolve_ticket(cls.ticket.assignee, cls.ticket, notes="Reseated connectors and tested generation.", hours=1)

    def test_sales_and_accounts_cannot_close_a_ticket_with_a_forged_rating(self):
        for role in (Role.SALES, Role.ACCOUNTS):
            with self.assertRaises(rules.RuleError):
                rules.confirm_ticket(sim.actor(role), self.ticket, True, rating=5)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, Ticket.Status.RESOLVED)
        self.assertIsNone(self.ticket.rating)

    def test_support_can_still_record_the_customers_answer(self):
        rules.confirm_ticket(sim.actor(Role.SUPPORT), self.ticket, True, rating=4)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, Ticket.Status.CLOSED)
