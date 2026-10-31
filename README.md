# SunThread: Solar Installation Management System

One thread from a customer's first enquiry to the 20-year warranty, for a rooftop-solar installer. Built for a 24-hour hackathon (Odoo-style flow, custom Django stack).

- Spec and demo script: [SOLUTION.md](others/docs/SOLUTION.md)
- **Picking this up? Start with [HANDOFF.md](others/docs/HANDOFF.md)**; who-does-what in [TEAM.md](others/docs/TEAM.md)

```text
frontend/
  src/                React pages, Material UI components and theme
  static/             Shared geocoding helper
  package.json        React + Vite build, dev and test commands
  dist/               Generated Vite build (ignored by Git)
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
  legacy-frontend/    Archived migration sources (not used by the website)
  deploy/             Static frontend / Django API deployment example
```

Run the following commands from the repository root. The root `manage.py` and `requirements.txt` forward to the backend so existing commands still work. Project configuration and `.venv/` stay at the root.

```bash
pip install -r requirements.txt
python manage.py migrate
cd frontend
npm ci
npm run dev                                           # http://127.0.0.1:5173
```
`npm run dev` starts Vite and Django together. Open http://127.0.0.1:5173/. See [frontend/README.md](frontend/README.md) for separate-process and production setup. Run `python manage.py test core` from the repository root for backend checks.

The complete application frontend uses React + Vite and Material UI with a shared SunPower theme. CRM, inventory, field forms, signatures, uploads, accounting, helpdesk, customer workflows and print documents are React components. Django provides authenticated JSON APIs, permissions and business rules.

For production, run `npm run build` inside `frontend/`, serve `frontend/dist/` with an SPA fallback, and proxy `/api/` and `/media/` to Django on the same origin. See [the Nginx example](others/deploy/nginx.conf).
To reset the demo database, use `python manage.py seed`.
Customer portal at `/portal/`, staff app at `/app/`, public enquiry form at `/enquire/`. Demo mode has a user switcher for signed-in users. OTP codes are displayed only in demo mode; production uses password login until a real OTP delivery provider is configured.

Customer enquiries require an installation location selected through map search, a dropped pin, or the user's current location. The address, city and pincode appear in a read-only summary when available; the pin can also be used where address data is missing. Search and reverse lookup use the [Photon public demo service](https://github.com/komoot/photon#demo-server), with spaced requests and a small in-memory cache. Set `GEOCODER_URL` in the environment to use another Photon instance for heavier usage.

Run React interaction checks with `npm test` inside `frontend/`, and geocoding checks with `node --test others/scripts/test_geocoding.cjs` from the root.
