"""The standalone React application's JSON, session and permission contracts."""
import json

from django.test import Client, TestCase, override_settings

from core import rules, seed_data, sim
from core.models import Serial, User


class ReactFrontend(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()

    def state(self, response):
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')
        return response.json()['state']

    def test_public_api_returns_data_without_page_markup(self):
        response = self.client.get('/api/ui/enquire/')
        state = self.state(response)
        self.assertEqual(state['page'], 'enquire')
        self.assertIsNone(state['user'])
        self.assertEqual(state['demoUsers'], [])
        self.assertTrue(state['csrf'])
        self.assertNotIn('<html', response.content.decode())
        self.assertNotIn('frontend-state', response.content.decode())

    def test_staff_sign_in_via_react_api(self):
        response = self.client.get('/api/ui/employee/login/')
        state = self.state(response)
        self.assertEqual(state['page'], 'employee_login')
        self.assertTrue(state['employeePortal'])
        response = self.client.post('/api/ui/employee/login/', {
            'username': 'arjun', 'password': seed_data.DEMO_PASSWORD})
        self.assertEqual(response.json()['redirect'], '/app/')
        self.assertEqual(self.state(self.client.get('/api/ui/app/'))['user']['role'], 'Sales')

    def test_invalid_submission_does_not_serialize_password(self):
        name = '</script><script>alert(1)</script>'
        response = self.client.post('/api/ui/enquire/', {
            'name': name, 'phone': '9600000001', 'password': 'do-not-serialize-this',
            'site_lat': '', 'site_lng': ''})
        state = self.state(response)
        self.assertNotIn('password', state['form'])
        self.assertNotIn('do-not-serialize-this', response.content.decode())
        self.assertEqual(state['form']['name'], name)
        self.assertIn('application/json', response['Content-Type'])

    def test_staff_dashboard_has_only_authorized_navigation(self):
        user = User.objects.filter(role='sales').first()
        self.client.force_login(user)
        state = self.state(self.client.get('/api/ui/app/'))
        self.assertEqual(state['user']['id'], user.pk)
        self.assertIn('dashboard', state)
        self.assertNotIn('Accounting', [n['label'] for n in state['navigation']])

    def test_customer_data_does_not_include_other_customers(self):
        one = sim.enquire('First Customer', '9600000001', password='secret1')
        two = sim.enquire('Other Customer', '9600000002', password='secret1')
        self.client.force_login(one.customer.user)
        response = self.client.get('/api/ui/portal/')
        state = self.state(response)
        self.assertEqual([p['id'] for p in state['projects']], [one.pk])
        self.assertNotIn(two.customer.name, response.content.decode())
        self.assertNotIn('dashboard', state)
        denied = self.client.get(f'/api/ui/portal/p/{two.pk}/')
        self.assertEqual(denied.status_code, 404)
        self.assertIn('error', denied.json())

    def test_otp_entry_and_disabled_demo_redirects_are_json(self):
        self.assertEqual(self.state(self.client.get('/api/ui/otp/'))['otp']['step'], 'request')
        with override_settings(DEMO_MODE=False):
            for method in ('get', 'post'):
                response = getattr(self.client, method)('/api/ui/otp/', {'action': 'send', 'phone': '9600000001'})
                self.assertEqual(response.json()['redirect'], '/login/')

    def test_logout_remains_post_only(self):
        self.assertEqual(self.client.get('/api/ui/logout/').status_code, 405)

    def test_csrf_is_enforced_on_api_actions(self):
        client = Client(enforce_csrf_checks=True)
        denied = client.post('/api/ui/logout/')
        self.assertEqual(denied.status_code, 403)
        self.assertIn('error', denied.json())
        state = self.state(client.get('/api/session/'))
        response = client.post('/api/ui/logout/', HTTP_X_CSRFTOKEN=state['csrf'])
        self.assertEqual(response.json()['redirect'], '/')

    def test_api_normalizes_auth_redirects_and_missing_records(self):
        response = self.client.get('/api/ui/app/crm/')
        self.assertTrue(response.json()['redirect'].startswith('/login/'))
        response = self.client.get('/api/ui/app/no-such-page/')
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.json())

    def test_settings_are_director_only_and_validate_before_saving(self):
        from core import config
        self.client.force_login(sim.actor('sales'))
        self.assertEqual(self.client.get('/api/ui/app/settings/').status_code, 403)
        self.client.force_login(sim.actor('director'))
        self.assertEqual(self.client.get('/api/ui/app/settings/').json()['page'], 'settings')
        key = next(k for k, v in config.DEFAULTS.items() if isinstance(v, (int, float)))
        before = config.get(key)
        response = self.client.post('/api/ui/app/settings/', {key: '-1'})
        self.assertEqual(config.get(key), before)
        self.assertEqual(response.json()['state']['messages'][0]['level'], 'error')

    def test_remaining_workflows_and_documents_have_json_contracts(self):
        p = sim.run_to_installed(sim.enquire('React Coverage', '9600000003', password='secret1'))
        serial = Serial.objects.get(project=p, product__category='inverter')
        ticket = rules.open_ticket(p.customer.user, p.customer, serial=serial, fault_code='E04', source='portal')
        self.client.force_login(sim.actor('director'))
        pending = sim.enquire('Pending Survey', '9600000004')
        sim.qualify(pending)
        delivered = sim.run_to_delivered(sim.enquire('Pending Install', '9600000005'))
        urls = ['/app/crm/', '/app/crm/new/', '/app/inventory/', '/app/inventory/receive/',
                '/app/inventory/serials/', f'/app/inventory/serials/{serial.pk}/',
                '/app/inventory/dispatch/', f'/app/inventory/dispatch/{p.dispatches.first().pk}/',
                '/app/field/', '/app/field/schedule/', f'/app/field/survey/{pending.survey.pk}/',
                f'/app/field/install/{delivered.job.pk}/', f'/app/field/delivery/{p.dispatches.first().pk}/',
                '/app/help/', f'/app/help/customer/{p.customer_id}/', f'/app/help/ticket/new/?customer={p.customer_id}',
                '/app/help/tickets/', f'/app/help/tickets/{ticket.pk}/', '/app/accounts/',
                '/app/insights/', f'/app/insights/p/{p.pk}/', '/notifications/']
        urls += [f'/app/p/{p.pk}/?tab={tab}' for tab in ('overview', 'qualification', 'survey', 'quote',
                 'payments', 'dispatch', 'install', 'subsidy', 'tickets', 'timeline')]
        for url in urls:
            with self.subTest(url=url):
                response = self.client.get('/api/ui' + url)
                self.state(response)
                self.assertIsInstance(response.json()['data'], dict)
        self.client.force_login(p.customer.user)
        urls = [f'/portal/p/{p.pk}/', f'/portal/p/{p.pk}/quote/', f'/portal/p/{p.pk}/pay/',
                '/portal/systems/', '/portal/requests/', '/portal/requests/new/', f'/portal/requests/{ticket.pk}/',
                f'/doc/quote/{p.accepted_quote.pk}/', f'/doc/invoice/{p.invoices.first().pk}/',
                f'/doc/receipt/{p.payments.filter(status="confirmed").first().pk}/',
                f'/doc/delivery/{p.dispatches.first().pk}/', f'/doc/handover/{p.pk}/', f'/doc/warranty/{p.pk}/']
        for url in urls:
            with self.subTest(url=url):
                response = self.client.get('/api/ui' + url)
                self.state(response)
                self.assertTrue(response.json()['data'])
                for secret in ('unit_cost', 'margin', 'drafted from template'):
                    self.assertNotIn(secret, json.dumps(response.json()['data']))
