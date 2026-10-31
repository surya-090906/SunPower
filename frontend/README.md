# Frontend

React 19 + Vite 8 + Material UI, using a custom solar theme based on MUI's free dashboard and sign-in patterns. DM Sans fonts are bundled locally; Leaflet is bundled through npm.

## Development

Install Python dependencies and migrate the database from the repository root first. Then:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. The development command starts Django on port 8000 and Vite on port 5173. Vite serves the complete React application and proxies `/api/` and `/media/` to Django. It uses the repository's `.venv` when available. Set `PYTHON` to another interpreter if needed. If a port is already in use, set `DJANGO_PORT` or `VITE_PORT`.

For separate processes, start Django normally, then run `npm run dev:assets`. `DJANGO_ORIGIN` controls the proxy target (default `http://127.0.0.1:8000`). Always open the Vite URL to use the website.

## Production build

```powershell
npm ci
npm run build
```

Serve `dist/` with a static web server. All application paths (including `/app/`, `/portal/`, `/doc/` and `/enquire/`) must fall back to `dist/index.html`. Proxy `/api/` and `/media/` to Django on the **same origin** so session cookies and CSRF protection work. See `../others/deploy/nginx.conf` for an example. Django does not serve the React build. `dist/` and `node_modules/` are generated and ignored; commit `package.json` and `package-lock.json`.

## Structure

- `src/pages/`: landing, login/OTP, map enquiry, dashboards and business settings.
- `src/pages/generated/`: native JSX for CRM, inventory, field work, accounting, helpdesk, customer workflows and printable documents. These files are normal React source and can be edited directly.
- `src/components/`: Material UI navigation, form controls, location picker and shared components.
- `src/theme.js`, `src/styles.css`: UI tokens and responsive layouts.
- `src/components/NativeRuntime.jsx`: reusable React fields, installation wizard, signature canvas, photo uploader and customer-message extraction.
- `src/styles/workflows.css`: shared workflow and print styling.
- `static/js/geocoding.js`: shared, tested geocoding helper.

React owns page rendering, navigation, form state, uploads, signatures and printing. `src/lib/api.js` submits multipart forms to `/api/ui/<application-path>` with session cookies and CSRF headers. Backend redirects become JSON navigation instructions; validation messages return as data. Browser back/forward and direct links remain supported.

The one-time migration sources are archived in `../others/legacy-frontend/`. They are not loaded by Vite or Django. There is no runtime Django HTML bridge or server-rendered application fallback.

## Checks

```powershell
npm test
npm run build
cd ..
python manage.py test core
node --test others/scripts/test_geocoding.cjs
```

The interface uses the MIT-licensed Material UI library with a custom SunPower theme; no paid template is required.
