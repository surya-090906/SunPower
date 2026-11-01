"""Export synthetic React API fixtures against a disposable test database.

Run from repo root: python manage.py shell -c "exec(open('others/scripts/render_frontend_fixtures.py').read())"
These ignored artifacts are JSON data fixtures, never authentication endpoints.
"""
import json
from pathlib import Path
from django.test import Client
from django.test.utils import setup_databases, teardown_databases
from core import seed_data, sim
from core.models import User

destination=Path('others/artifacts/react').resolve()
destination.mkdir(parents=True,exist_ok=True)
database_configuration=setup_databases(verbosity=0,interactive=False)
try:
    seed_data.load_catalogue()
    seed_data.load_staff()
    project=sim.enquire('Browser Fixture Customer','9600000011',password='fixture-only-password')
    staff=Client()
    staff.force_login(User.objects.filter(role='director').first())
    customer=Client()
    customer.force_login(project.customer.user)
    for name,client,url in [('dashboard',staff,'/app/'),('pipeline',staff,'/app/crm/'),
                             ('quick-add',staff,'/app/crm/new/'),('portal',customer,'/portal/'),
                             ('project',customer,f'/portal/p/{project.pk}/')]:
        response=client.get(url)
        if response.status_code != 200:
            raise RuntimeError(f'{name}: HTTP {response.status_code}')
        (destination/f'{name}.json').write_text(json.dumps(response.json(),ensure_ascii=False,indent=2),encoding='utf-8')
    print('Exported five JSON fixtures using a disposable test database.')
finally:
    teardown_databases(database_configuration,verbosity=0)
