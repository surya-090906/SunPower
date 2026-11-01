from django.test import TestCase
from core import rules, seed_data, sim
from core.calc.support import customer_support
from core.models import Serial, Ticket


class InstalledCustomerSupport(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()
        cls.installed=sim.run_to_installed(sim.enquire('Installed Customer','9600000051',password='test-pass'))
        cls.delivered=sim.run_to_delivered(sim.enquire('Before Installation','9600000052',password='test-pass'))

    def setUp(self):
        self.client.force_login(self.installed.customer.user)

    def test_support_is_available_when_installed_with_active_warranty(self):
        support=customer_support(self.installed)
        self.assertTrue(support['available'])
        self.assertGreater(support['coveredUnits'],0)
        response=self.client.get('/api/ui/portal/').json()
        self.assertTrue(response['state']['projects'][0]['tracker']['support']['available'])
        response=self.client.get(f'/api/ui/portal/p/{self.installed.pk}/').json()
        self.assertEqual(response['data']['support']['url'],f'/portal/requests/new/?project={self.installed.pk}')

    def test_customer_can_submit_problem_and_get_warranty_coverage(self):
        unit=Serial.objects.get(project=self.installed,product__category='inverter')
        response=self.client.post('/api/ui/portal/requests/new/',{
            'project':self.installed.pk,'serial':unit.pk,'fault_code':'E04','description':'Inverter stopped generating.'})
        ticket=Ticket.objects.get(customer=self.installed.customer)
        self.assertEqual(ticket.project_id,self.installed.pk)
        self.assertTrue(ticket.covered)
        self.assertIn(f'/portal/requests/{ticket.pk}/',response.json()['redirect'])

    def test_delivered_equipment_cannot_be_reported_before_installation(self):
        self.assertFalse(customer_support(self.delivered)['available'])
        unit=Serial.objects.get(project=self.delivered,product__category='inverter')
        with self.assertRaises(rules.RuleError):
            rules.open_ticket(self.delivered.customer.user,self.delivered.customer,serial=unit,fault_code='E04')
        self.client.force_login(self.delivered.customer.user)
        response=self.client.post('/api/ui/portal/requests/new/',{'serial':unit.pk,'fault_code':'E04'})
        self.assertEqual(response.json()['page'],'portal/request_new')
        self.assertFalse(Ticket.objects.filter(customer=self.delivered.customer).exists())

    def test_project_scoping_rejects_another_customers_system(self):
        response=self.client.get(f'/api/ui/portal/requests/new/?project={self.delivered.pk}')
        self.assertEqual(response.status_code,404)
        self.assertEqual(self.client.get('/api/ui/portal/requests/new/?project=invalid').status_code,404)

    def test_solar_panels_have_report_action_after_installation(self):
        response=self.client.get('/api/ui/portal/systems/').json()
        self.assertIn('PNL',str(response['data']))
        # Every delivered unit, including panels, can be selected for this project.
        response=self.client.get(f'/api/ui/portal/requests/new/?project={self.installed.pk}').json()
        panel=Serial.objects.filter(project=self.installed,product__category='panel').first()
        self.assertIn(panel.serial_no,str(response['data']))
