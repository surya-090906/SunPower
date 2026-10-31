# HANDOFF: read this first

Status as of 2026-10-31. Branch `dev` holds the work; `main` holds only the blueprint. Product spec: [SOLUTION.md](SOLUTION.md) (v1.1). **Stack changed from the blueprint's default: it is Django (Python), not Next.js**, because Odoo-hackathon teams know Python and it needed no front-end build. Ignore the Next.js/Prisma parts of SOLUTION.md §9.

## Run it
```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt     # Windows (Git Bash: ./.venv/Scripts/python.exe)
.venv\Scripts\python.exe manage.py seed          # ~40 s: resets db.sqlite3, replays 38 projects through the real rules
.venv\Scripts\python.exe manage.py runserver     # http://127.0.0.1:8000
.venv\Scripts\python.exe manage.py test core     # 41 tests, ~17 s, must stay green
.venv\Scripts\python.exe manage.py shell -c "exec(open('scripts/smoke_crawl.py', encoding='utf-8').read())"   # ~750 pages, as every role
```
- On Windows set `PYTHONIOENCODING=utf-8` when printing ₹ from scripts.
- Logins: staff usernames `meera` (director), `arjun` (sales), `vikram` (engineer), `kiran` (warehouse), `divya` (support), `lakshmi` (accounts), `imran`/`ravi` (technicians). Customers log in with their phone number, e.g. `9886000101` Ramesh (inverter in warranty, 6 months left), `9886000102` Farida (units expired), `9886000138` Anand (quote accepted, awaiting advance). Shared demo password: see `.env.example` (`DEMO_PASSWORD`). With `DEMO_MODE=1` (default) every page has a user switcher, so no password is needed.
- Anita Rao (the live demo customer) is deliberately NOT seeded: enquire as her at `/enquire/`.

## Architecture in five lines
1. `core/models.py`: all tables. Money is integer paise. Every timestamp uses `core/clock.py` (never `timezone.now()` directly) so the seed can replay history in the past.
2. `core/rules/*.py`: the workflow engine, transitions T0..T16 (see docstring in `core/rules/__init__.py`). **The only place state changes.** Each rule checks a guard (raises `RuleError` with the user-facing message), then writes timeline, notifications, ledger, messages in one transaction. Views and templates never change a stage directly.
3. `core/calc/*.py`: pure-ish helpers (warranty, pricing/kit templates, scheduling, stock, finance/profit, tracker, next-action/stuck, dashboard insights).
4. `portal/` = customer portal (`/portal/`), `backoffice/` = staff app (`/app/`), `core/views.py` + `core/docs.py` = public pages, login, notifications, printable documents (`/doc/...`).
5. `core/sim.py` + `core/seed_data.py` + `core/management/commands/seed.py`: drive the real rules with sample data. Tests and seed share them.

## What is done (blueprint P0 + most P1)
Enquiry by the customer (optional password creates login; staff-entered customers get a one-time `/claim/<token>/` link) → qualification (declared vs verified) → survey (mobile form, photo upload, engineer approval) → kit-template quote with parts check, discount cap, margin chip → customer accepts in portal → pay (demo checkout instant, or UPI/bank reference that Accounts must verify) → order confirms by itself (pick list, install slot, subsidy checklist) → serial scan/pack/dispatch gate → delivery starts warranty per serial → install wizard (checklist, times, photos, signature, geotag) → ledger revenue/labour, final invoice, handover certificate → tickets with instant warranty verdict, replacement inherits warranty, billed automatically when expired, closed only by customer confirmation → Director dashboard (day/week/month, profit per job, waterfall, stuck list, repairs, payroll, shareable snapshot, CSV). Also: universal search, customer 360, serial explorer, schedule board, webhook `POST /api/enquiry/` (header `X-API-Key: demo-key`).

## Verified vs not verified
- Verified by automated tests: all rules, the entire week driven through real URLs (`core/tests/test_views.py`), portal isolation (G13), no costs/margins in portal (G14), enquiry account hijack protection (G15), payment paths (G16), 752-page smoke crawl.
- Verified by eye in the browser: landing, customer portal on mobile (systems + tracker), Director dashboard. **Not eyeballed:** every other staff screen, the install/survey wizards, photo upload, signature pad, geotag, dark/light polish. The JS in `static/js/field.js` has never run in a real browser; test it first.

## Next steps (suggested order)
1. Open each staff screen once in the browser, fix layout issues (CSS in `static/css/app.css`).
2. Exercise `static/js/field.js` on a phone-sized viewport: survey photos, install wizard steps, signature, "Capture location".
3. Update SOLUTION.md §9 to say Django; write a short README demo section (the demo script is SOLUTION.md §8).
4. Rehearse the demo; record a backup video. Reset with `manage.py seed`.
5. P2 items (see TEAM.md): yield/payback estimate, margin guard needing Director approval, camera barcode scan, QR labels, OTP login, fault-code hints, paste-WhatsApp-to-lead, customer accepts install in portal, ticket rating, subsidy document upload, schedule reassignment UI.

## Gotchas
- Django template quirk: a missing dict key used as a *filter argument* (`|default:d.key`) raises. Pass dicts with every key present (see `_declared` in `backoffice/views_crm.py`).
- The Bash tool breaks on heredocs containing apostrophes; write files with the editor tools instead.
- Seed replay order matters: projects waiting for stock must be replayed last, or they take stock from earlier ones (FIFO release in `_release_awaiting_stock`).
- Warranty months are snapshotted onto each Serial at delivery; replacing a unit under warranty copies the old end date.
- Revenue is booked at install sign-off, not at order; in-flight jobs show an *estimated* margin.
- Subsidy amounts, GST rates and prices are illustrative; verify before real use.
- Line endings: Git warns LF→CRLF on Windows; harmless (`.gitattributes` normalises).

## Commit history (branch `dev`)
foundation + models → rules engine + tests → seed → portal + documents + design system → staff app → UI tests/smoke crawl → this documentation. Commits are authored with the machine's git identity plus a `Co-Authored-By` trailer for the AI agent. Teammates must make their own commits for their own work (see TEAM.md); do not fabricate authorship.
