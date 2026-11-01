# Team split and real tasks for each member

The hackathon requires every member to commit. These are genuine, scoped tasks that are not built yet, grouped by the four slices in SOLUTION.md §10. Each person: `git checkout dev && git pull`, branch `feature/<yourname>-<task>`, commit under your own identity, open a merge into `dev`. Keep `python manage.py test core` green.

| Slice | Owns (files) | Good first tasks |
|---|---|---|
| A: Sales and quoting | `backend/core/rules/sales.py`, `quotes.py`, `backend/portal/`, `templates/public`, `templates/portal` | Estimated yield and payback on the quote (SOLUTION.md §5.2 stretch, `backend/core/calc/`); margin guard: quotes under a configured margin need Director approval; paste-a-WhatsApp-message-to-lead parser on the quick-add page; polish the enquiry form |
| B: Stock and warranty | `backend/core/rules/stock.py`, `backend/core/calc/stock.py`, `backend/backoffice/views_inventory.py` | Camera barcode scanning (`BarcodeDetector`) on the pick screen; printable QR labels for new serials; purchase suggestions page; test: concurrent scans cannot double-pick a serial |
| C: Field and helpdesk | `backend/core/rules/field.py`, `service.py`, `backend/backoffice/views_field.py`, `views_help.py`, `frontend/static/js/field.js` | Fault-code hints (e.g. insulation faults are common in rain) shown on the ticket; schedule board reassign UI; offline draft of the install form in localStorage; test the wizard on a real phone and fix bugs; customer accepts the install in the portal; ticket rating |
| D: Platform and insights | `backend/core/calc/insights.py`, `backend/backoffice/views_accounts.py`, `backend/core/management/commands/seed.py`, docs | OTP login (simulated code in demo mode); subsidy document upload by the customer; dashboard polish and charts; README and demo walkthrough; screenshots; pitch deck; update SOLUTION.md §9 to Django |

Rules of the road: change workflow behaviour only inside `backend/core/rules/`; add a test with every rule change; customer-facing text goes in `customer_message` of the timeline event; never show costs, margins or stock in `backend/portal/` or `templates/docs`.
