# Report an installation problem

After installation, each customer project card and project details page displays
**Warranty and support** with current equipment coverage and a **Report a problem**
button. This action remains available when installation is complete and a balance
or subsidy paperwork is still pending.

The button opens the service form for that installation only. The customer picks
the affected unit, checks its warranty badge, enters a fault code or description,
and sends the request. Solar panels can be reported as well as other equipment.
The request shows its coverage verdict, and the existing support/technician
workflow schedules and handles the visit.

Customers can report only their own installed equipment. Delivered equipment
awaiting installation is not eligible for this portal action. Hardware-only
orders become eligible after delivery. Existing paid service handling remains
available for units whose warranty has expired or does not cover the problem.

No database migration or additional dependency is required for this update.
Upload all files at their original repository paths, rebuild the frontend with
`npm run build` in `frontend/`, and restart Django to load the updated page data
and service rules.
