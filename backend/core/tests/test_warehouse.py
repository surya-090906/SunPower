from django.test import TestCase
from core import rules, seed_data, sim
from core.models import Role, Serial


class CustomerMaterialBundles(TestCase):
    @classmethod
    def setUpTestData(cls):
        seed_data.load_catalogue()
        seed_data.load_staff()
        cls.project = sim.run_to_ordered(sim.enquire('Bundle Customer', '9600000071', password='test-secret'))
        sim.top_up_for(cls.project)
        cls.dispatch = cls.project.dispatches.get()
        cls.other = sim.run_to_ordered(sim.enquire('Another Customer', '9600000072'))

    def setUp(self):
        self.wh = sim.actor(Role.WAREHOUSE)
        self.client.force_login(self.wh)

    def scan(self, code, qty=''):
        return self.client.post(f'/api/ui/app/inventory/dispatch/{self.dispatch.pk}/do/', {
            'action':'scan_material','code':code,'qty':qty,'return_customer':self.project.customer_id})

    def test_queue_groups_requests_by_customer(self):
        # A customer can have a separate bundle for a second installation order.
        second = sim.run_to_ordered(sim.enquire('Bundle Customer','9600000071',kw=2))
        data = self.client.get('/api/ui/app/inventory/dispatch/').json()['data']
        group = next(c for c in data['customers'] if c['id']==self.project.customer_id)
        self.assertEqual(len(group['bundles']),2)
        self.assertEqual({b['project'] for b in group['bundles']},{self.project.code,second.code})
        detail = self.client.get(f'/api/ui/app/inventory/customers/{self.project.customer_id}/').json()['data']
        self.assertEqual(len(detail['bundles']),2)
        self.assertNotIn(self.other.customer.name,str(detail))

    def test_serial_scan_links_unit_to_exact_customer_and_bundle(self):
        serial = Serial.objects.filter(product__sku='INV-3K',status='in_stock').first()
        response = self.scan(serial.serial_no)
        self.assertEqual(response.json()['redirect'],f'/app/inventory/customers/{self.project.customer_id}/')
        serial.refresh_from_db()
        self.assertEqual(serial.project_id,self.project.pk)
        self.assertEqual(serial.dispatch_id,self.dispatch.pk)
        detail = self.client.get(response.json()['redirect'].replace('/app/','/api/ui/app/',1)).json()['data']
        self.assertIn(serial.serial_no,str(detail['bundles']))
        self.scan(serial.serial_no)
        self.assertEqual(self.dispatch.lines.get(product=serial.product).qty_picked,1)

    def test_loose_material_scans_quantity_and_blocks_overpacking(self):
        line = self.dispatch.lines.filter(product__tracked_by_serial=False,qty_required__gt=1).first()
        rules.scan_material(self.wh,self.dispatch,line.product.sku,'1')
        line.refresh_from_db()
        self.assertEqual(line.qty_picked,1)
        with self.assertRaises(rules.RuleError):
            rules.scan_material(self.wh,self.dispatch,line.product.sku,str(line.qty_required))
        for qty in ('NaN','-1','0','bad'):
            with self.subTest(qty=qty),self.assertRaises(rules.RuleError):
                rules.scan_material(self.wh,self.dispatch,line.product.sku,qty)
        rules.scan_material(self.wh,self.dispatch,line.product.sku,str(line.remaining))
        line.refresh_from_db()
        self.assertTrue(line.complete)

    def test_wrong_material_and_product_sku_for_tracked_item_are_rejected(self):
        for code in ('UNKNOWN-ITEM','INV-3K'):
            with self.subTest(code=code),self.assertRaises(rules.RuleError):
                rules.scan_material(self.wh,self.dispatch,code)

    def test_all_materials_required_before_dispatch(self):
        for line in self.dispatch.lines.select_related('product'):
            if line.product.tracked_by_serial:
                for serial in Serial.objects.filter(product=line.product,status='in_stock')[:int(line.qty_required)]:
                    rules.scan_material(self.wh,self.dispatch,serial.serial_no)
            else:
                rules.scan_material(self.wh,self.dispatch,line.product.sku,str(line.qty_required))
        self.dispatch.refresh_from_db()
        self.assertEqual(self.dispatch.status,'ready')
        rules.dispatch_order(self.wh,self.dispatch)
        with self.assertRaises(rules.RuleError):
            rules.scan_material(self.wh,self.dispatch,'CBL-DC')

    def test_customer_and_sales_cannot_access_or_scan_warehouse_bundles(self):
        for user in (self.project.customer.user,sim.actor(Role.SALES)):
            self.client.force_login(user)
            response=self.client.get(f'/api/ui/app/inventory/customers/{self.project.customer_id}/')
            self.assertIn('redirect',response.json())
            self.scan('INV-3K')
        self.assertFalse(Serial.objects.filter(project=self.project).exists())
