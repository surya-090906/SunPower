# Backend

`core/` owns models and workflow rules. `backoffice/` and `portal/` expose staff and customer workflows. `sunthread/` contains Django settings, URLs, WSGI and ASGI entry points.

The local database and uploaded media live here. The application backend returns JSON and CSV; the React frontend is served separately.

`/api/session/` supplies the current session and CSRF token. `/api/ui/<application-path>` supplies page data and accepts multipart actions, retaining the existing permissions, uploads and domain rules. Redirects return `{redirect, messages}`; pages return `{page, state, data}`; errors return `{error}` with an HTTP error status. CSV exports remain downloads. React renders documents from their authorized JSON data.

`core/page_contracts.json` lists the exact values exposed by each workflow. `core/api.py` projects only active branches and authorized rows, using the existing formatting filters. It never renders page HTML or serializes whole model objects. Do not accept projections or expressions from client input. Passwords and arbitrary POST fields are excluded from responses.

Serve the frontend and proxy `/api/` and `/media/` on the same public origin. Set `SITE_URL` to that public frontend origin. Django's optional `/admin/` is a backend administration utility; application settings use the React `/app/settings/` screen. `collectstatic` is needed only if exposing the administration utility's assets.

From this folder, run `python manage.py runserver` or `python manage.py test core`. The root launcher supports the same commands. For WSGI/ASGI hosting, use this folder as the working directory and `sunthread.wsgi:application` or `sunthread.asgi:application` as the entry point.
