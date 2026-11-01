"""Serve the API with synthetic data in a disposable database for UI verification.

Run with: python manage.py shell -c "exec(open('others/scripts/preview_react.py').read())"
Then start Vite with DJANGO_ORIGIN=http://127.0.0.1:8018.
No local customer database or uploaded files are modified.
"""
from pathlib import Path
from tempfile import TemporaryDirectory

from django.conf import settings
from django.core.management import call_command
from django.test.utils import setup_databases, teardown_databases

from core import seed_data, sim
from core.models import User

database_configuration = setup_databases(verbosity=0, interactive=False)
try:
    with TemporaryDirectory(prefix='sunpower-preview-') as media:
        settings.MEDIA_ROOT = Path(media)
        seed_data.load_catalogue()
        seed_data.load_staff()
        installed = sim.run_to_installed(sim.enquire('React Demo Customer', '9600000091'))
        customer_user = User.objects.create_user(username='preview-customer', first_name='React', last_name='Demo Customer',
                                                role='customer', phone='9600000091', demo_pin=True)
        installed.customer.user = customer_user
        installed.customer.save(update_fields=['user'])
        survey = sim.enquire('Survey Demo Customer', '9600000092')
        sim.qualify(survey)
        install = sim.run_to_delivered(sim.enquire('Installation Demo Customer', '9600000093'))
        quote = sim.enquire('Quote Demo Customer', '9600000094')
        sim.qualify(quote)
        sim.survey(quote)
        sim.approve(quote)
        sim.quote(quote)
        ordered = sim.run_to_ordered(sim.enquire('Warehouse Demo Customer', '9600000095'))
        sim.top_up_for(ordered)
        print(f'Preview projects: installed={installed.pk}, survey={survey.survey.pk}, install={install.job.pk}, quote={quote.pk}', flush=True)
        call_command('runserver', '127.0.0.1:8018', use_reloader=False, use_threading=False)
finally:
    teardown_databases(database_configuration, verbosity=0)
