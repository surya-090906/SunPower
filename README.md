# SunThread: Solar Installation Management System

One thread from a customer's first enquiry to the 20-year warranty, for a rooftop-solar installer. Built for a 24-hour hackathon (Odoo-style flow, custom Django stack).

- Spec and demo script: [SOLUTION.md](SOLUTION.md)
- **Picking this up? Start with [HANDOFF.md](HANDOFF.md)**; who-does-what in [TEAM.md](TEAM.md)

```bash
pip install -r requirements.txt
python manage.py seed && python manage.py runserver     # http://127.0.0.1:8000
python manage.py test core
```
Customer portal at `/portal/`, staff app at `/app/`, public enquiry form at `/enquire/`. Demo mode has a user switcher on every page.
