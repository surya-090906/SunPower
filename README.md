# SunThread: Solar Installation Management System

One thread from a customer's first enquiry to the 20-year warranty, for a rooftop-solar installer. Built for a 24-hour hackathon (Odoo-style flow, custom Django stack).

- Spec and demo script: [SOLUTION.md](others/docs/SOLUTION.md)
- **Picking this up? Start with [HANDOFF.md](others/docs/HANDOFF.md)**; who-does-what in [TEAM.md](others/docs/TEAM.md)

```text
frontend/
  templates/          Django HTML templates
  static/             CSS and browser JavaScript
backend/
  core/               Models, workflow rules, calculations and Django tests
  backoffice/         Staff views and routes
  portal/             Customer views and routes
  sunthread/          Django settings and server entry points
  manage.py           Django command entry point
  requirements.txt    Python dependencies
  db.sqlite3          Local database (ignored by Git)
  media/              Uploaded files (ignored by Git)
others/
  docs/               Product specification, handoff and team notes
  scripts/            Smoke crawl and JavaScript tests
```

Run the following commands from the repository root. The root `manage.py` and `requirements.txt` forward to the backend so existing commands still work. Project configuration and `.venv/` stay at the root.

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver                             # http://127.0.0.1:8000
python manage.py test core
```
To reset the demo database, use `python manage.py seed`.
Customer portal at `/portal/`, staff app at `/app/`, public enquiry form at `/enquire/`. Demo mode has a user switcher on every page.

Customer enquiries require an installation location selected through map search, a dropped pin, or the user's current location. The address, city and pincode appear in a read-only summary when available; the pin can also be used where address data is missing. Search and reverse lookup use the [Photon public demo service](https://github.com/komoot/photon#demo-server), with spaced requests and a small in-memory cache. Set `GEOCODER_URL` in the environment to use another Photon instance for heavier usage.

Run the map's JavaScript checks with `node --test others/scripts/test_geocoding.cjs others/scripts/test_enquiry_map.cjs`.
