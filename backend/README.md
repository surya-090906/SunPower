# Backend

`core/` owns models and workflow rules. `backoffice/` and `portal/` expose staff and customer workflows. `sunthread/` contains Django settings, URLs, WSGI and ASGI entry points.

The local database and uploaded media live here. Templates and static assets are loaded from `../frontend/` using paths anchored to the repository.

From this folder, run `python manage.py runserver` or `python manage.py test core`. The root launcher supports the same commands. For WSGI/ASGI hosting, use this folder as the working directory and `sunthread.wsgi:application` or `sunthread.asgi:application` as the entry point.
