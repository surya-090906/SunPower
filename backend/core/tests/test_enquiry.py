from decimal import Decimal

from django.test import Client, TestCase

from core import rules, seed_data, sim
from core.models import Customer, Project


class CustomerSignup(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_staff()

    def data(self, **overrides):
        return {
            "name": "New Customer", "phone": "9600000001", "address": "12 Lake Road",
            "pincode": "560001", "package": "ongrid", "kw": "3", "password": "secret1",
            "site_lat": "12.971600", "site_lng": "77.594600",
            **overrides,
        }

    def test_signup_saves_location_and_login_works(self):
        response = self.client.post("/enquire/", self.data(
            site_lat="12.9716123", site_lng="77.5946123", area="450",
            load="5", discom="BESCOM", call_time="Morning"))
        p = Project.objects.get()
        self.assertRedirects(response, f"/portal/p/{p.id}/")
        self.assertEqual(p.site_lat, Decimal("12.971612"))
        self.assertEqual(p.site_lng, Decimal("77.594612"))
        self.assertIn("12.971612%2C77.594612", p.maps_url)
        self.assertEqual(p.declared, {"area_sqft": 450})
        self.assertEqual(p.preferred_call_time, "")
        other_session = Client()
        self.assertRedirects(other_session.post("/login/", {
            "username": "9600000001", "password": "secret1"}), "/portal/")

    def test_typed_address_cannot_bypass_required_map_selection(self):
        response = self.client.post("/enquire/", self.data(site_lat="", site_lng=""))
        self.assertContains(response, "Choose your installation location on the map")
        self.assertFalse(Project.objects.exists())

    def test_map_pin_without_address_or_postcode_is_accepted(self):
        self.assertEqual(self.client.post("/enquire/", self.data(
            package="offgrid", address="", city="", pincode="", site_lat="51.5074", site_lng="-0.1278")).status_code, 302)
        p = Project.objects.get()
        self.assertEqual(p.site_address, "Map location: 51.507400, -0.127800")
        self.assertEqual(p.customer.pincode, "")
        self.assertEqual(p.customer.city, "")
        self.assertIn("51.507400%2C-0.127800", p.maps_url)

    def test_password_required_and_short_password_rejected_without_creating_records(self):
        for password in ("", "short"):
            with self.subTest(password=password):
                response = self.client.post("/enquire/", self.data(password=password))
                self.assertEqual(response.status_code, 200)
                self.assertFalse(Customer.objects.exists())
                self.assertNotIn("_auth_user_id", self.client.session)

    def test_unsupported_customer_packages_rejected(self):
        for package in ("panelset", "unsure", "invalid"):
            with self.subTest(package=package):
                response = self.client.post("/enquire/", self.data(package=package))
                self.assertContains(response, "Choose an On-Grid or Off-Grid system.")
                self.assertFalse(Project.objects.exists())

    def test_invalid_or_partial_map_coordinates_rejected_and_inputs_preserved(self):
        for lat, lng in (("91", "77"), ("12", "181"), ("NaN", "77"), ("12", ""), ("", "77"), ("invalid", "77")):
            with self.subTest(lat=lat, lng=lng):
                response = self.client.post("/enquire/", self.data(site_lat=lat, site_lng=lng))
                self.assertContains(response, "Choose a valid location on the map")
                self.assertContains(response, "12 Lake Road")
                self.assertFalse(Customer.objects.exists())

    def test_map_selection_preserved_after_another_validation_error(self):
        response = self.client.post("/enquire/", self.data(password="", site_lat="0", site_lng="0"))
        self.assertContains(response, 'name="site_lat" value="0"')
        self.assertContains(response, 'name="site_lng" value="0"')
        self.assertFalse(Project.objects.exists())

    def test_signed_in_customer_can_enquire_without_creating_another_password(self):
        self.client.post("/enquire/", self.data())
        first = Project.objects.get()
        response = self.client.post("/enquire/", self.data(
            phone="9600000002", name="Other Name", package="offgrid", password="", site_lat="0", site_lng="0"))
        second = Project.objects.get(kind="offgrid")
        self.assertRedirects(response, f"/portal/p/{second.id}/")
        self.assertEqual(second.customer_id, first.customer_id)
        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(second.site_lat, 0)
        self.assertIn("0.000000%2C0.000000", second.maps_url)

    def test_rules_require_activation_token_for_existing_unclaimed_customer(self):
        p = sim.enquire("Invited Customer", "9600000003", source="call")
        with self.assertRaises(rules.RuleError):
            sim.enquire("Attacker", "9600000003", password="secret1")
        p.customer.refresh_from_db()
        self.assertIsNone(p.customer.user_id)

    def test_existing_customer_can_select_another_site_for_the_same_system_type(self):
        self.client.post("/enquire/", self.data())
        original = Project.objects.get()
        response = self.client.post("/enquire/", self.data(
            password="", site_lat="13.000000", site_lng="78.000000", address="", pincode=""))
        new_project = Project.objects.exclude(pk=original.pk).get()
        self.assertRedirects(response, f"/portal/p/{new_project.id}/")
        self.assertEqual(new_project.site_lat, Decimal("13.000000"))
        self.assertEqual(new_project.customer_id, original.customer_id)
