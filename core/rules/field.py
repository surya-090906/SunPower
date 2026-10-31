"""T3 submit survey, T12 complete install (the customer is on site and signs)."""
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .. import clock, config
from ..models import (Invoice, InvoiceLine, InstallJob, JobAssignment, Project, Survey, Task, User)
from ..money import inr
from .common import (RuleError, add_task, log, message_customer, notify, notify_customer, post_ledger, require_role,
                     set_stage, users_with_role)


# ------------------------------------------------------------------ T3
@transaction.atomic
def submit_survey(actor, survey, *, roof_direction, tilt_deg, roof_type, usable_area_sqft, cable_run_m, shading,
                  notes=""):
    require_role(actor, "technician", "engineer")
    if survey.status != Survey.Status.REQUESTED:
        raise RuleError("This survey has already been submitted.")
    if roof_direction not in dict(Survey.DIRECTIONS):
        raise RuleError("Choose the direction the roof faces.")
    if tilt_deg in (None, "") or not 0 <= int(tilt_deg) <= 60:
        raise RuleError("Enter the roof tilt in degrees (0 to 60).")
    if roof_type not in ("rcc", "tin"):
        raise RuleError("Choose the roof type.")
    if not usable_area_sqft or int(usable_area_sqft) <= 0:
        raise RuleError("Enter the usable shadow-free area in sq ft.")
    if not cable_run_m or int(cable_run_m) <= 0:
        raise RuleError("Enter the cable run from the array to the inverter, in metres.")
    if shading not in ("none", "partial", "heavy"):
        raise RuleError("Choose the shading level.")
    need = config.get("min_photos_survey")
    have = survey.photos.count()
    if have < need:
        raise RuleError(f"At least {need} photos required ({have} added).")
    survey.roof_direction = roof_direction
    survey.tilt_deg = int(tilt_deg)
    survey.roof_type = roof_type
    survey.usable_area_sqft = int(usable_area_sqft)
    survey.cable_run_m = int(cable_run_m)
    survey.shading = shading
    survey.notes = notes
    survey.status = Survey.Status.DONE
    survey.submitted_at = clock.now()
    survey.save()
    project = survey.project
    set_stage(project, Project.Stage.SURVEY)
    log(project, f"Survey submitted by {actor.display_name if actor else 'technician'}: {roof_direction}-facing {survey.get_roof_type_display()} roof, "
        f"{survey.tilt_deg}° tilt, {survey.cable_run_m} m cable run, {survey.get_shading_display().lower()} shading.",
        customer_message="Survey completed. Our engineer is reviewing it.", actor=actor)
    notify(users_with_role("engineer"), f"Survey to review: {project.code}", project.customer.name,
           link=f"/app/p/{project.id}/?tab=survey")
    return survey


# ------------------------------------------------------------------ T12
CHECKS = [("check_stands", "Stands mounted"), ("check_panels", "Panels laid"), ("check_boxes", "Boxes connected"),
          ("check_earthing", "Earthing done"), ("check_generation", "Generation tested")]


def _create_final_invoice(project, quote):
    inv = Invoice.objects.create(
        project=project, kind=Invoice.Kind.FINAL, subtotal_paise=quote.subtotal_paise, tax_paise=quote.tax_paise,
        total_paise=quote.total_paise, due_date=clock.today() + timedelta(days=7), issue_date=clock.today())
    for l in quote.lines.all():
        InvoiceLine.objects.create(invoice=inv, description=l.description, qty=l.qty, unit_price_paise=l.unit_price_paise,
                                   tax_pct=l.tax_pct, net_paise=l.net_paise, tax_paise=l.tax_paise)
    return inv


@transaction.atomic
def complete_install(actor, job, *, started_at, finished_at, kw_confirmed, kw_note="", checks=None, test_reading_kw=None,
                     present_ids=(), signed_by="", signature="", geo_lat=None, geo_lng=None, notes=""):
    require_role(actor, "technician", "engineer")
    project = job.project
    if job.status == InstallJob.Status.SIGNED_OFF or project.stage in (Project.Stage.INSTALLED, Project.Stage.COMPLETED):
        raise RuleError("This job is already signed off.")
    if project.stage != Project.Stage.DELIVERED:
        raise RuleError("The equipment has not been delivered yet.")
    checks = checks or {}
    missing = [label for key, label in CHECKS if not checks.get(key)]
    if missing:
        raise RuleError("Checklist incomplete: " + ", ".join(missing).lower() + ".")
    if not started_at or not finished_at:
        raise RuleError("Enter the start and finish times.")
    if finished_at <= started_at:
        raise RuleError("Finish time must be after the start time.")
    if finished_at - started_at > timedelta(hours=14):
        raise RuleError("A single visit cannot be longer than 14 hours.")
    try:
        kw = Decimal(str(kw_confirmed))
    except (InvalidOperation, TypeError):
        raise RuleError("Enter the system size installed, in kW.")
    if kw <= 0:
        raise RuleError("Enter the system size installed, in kW.")
    quoted_kw = project.accepted_quote.kw if project.accepted_quote else project.requested_kw
    if kw != Decimal(quoted_kw) and not (kw_note or "").strip():
        raise RuleError(f"Installed size ({kw} kW) differs from the quoted {quoted_kw} kW. Add a note explaining why.")
    try:
        reading = Decimal(str(test_reading_kw))
    except (InvalidOperation, TypeError):
        reading = Decimal(0)
    if reading <= 0:
        raise RuleError("Enter the generation test reading in kW.")
    need = config.get("min_photos_install")
    have = job.photos.count()
    if have < need:
        raise RuleError(f"At least {need} photos required ({have} added).")
    if not present_ids:
        raise RuleError("Select the technicians who were on site.")
    if not (signed_by or "").strip():
        raise RuleError("Customer signature required: enter the customer's name.")
    if not signature or len(signature) < 200:
        raise RuleError("Customer signature required.")

    for key, _ in CHECKS:
        setattr(job, key, True)
    job.started_at, job.finished_at = started_at, finished_at
    job.kw_confirmed, job.kw_note, job.test_reading_kw = kw, kw_note, reading
    job.signed_by, job.signature, job.signed_at = signed_by.strip(), signature, clock.now()
    job.geo_lat, job.geo_lng, job.notes = geo_lat or None, geo_lng or None, notes
    job.status = InstallJob.Status.SIGNED_OFF
    job.save()

    hours = job.hours
    labour = 0
    for tid in present_ids:
        tech = User.objects.get(pk=tid, role="technician")
        a, _ = JobAssignment.objects.get_or_create(job=job, technician=tech, defaults={"role": "helper"})
        a.present, a.hours = True, hours
        a.save()
        labour += int(hours * tech.hourly_rate_paise)
    job.assignments.exclude(technician_id__in=list(present_ids)).update(present=False, hours=0)

    project.installed_at = clock.now()
    project.save(update_fields=["installed_at"])
    set_stage(project, Project.Stage.INSTALLED)
    post_ledger(project, "revenue", "contract", project.contract_value_paise, "job", job.id, "Contract value booked at sign-off")
    post_ledger(project, "cost", "labour", labour, "job", job.id, f"{len(present_ids)} technicians x {hours} h")
    quote = project.accepted_quote
    invoice = _create_final_invoice(project, quote)
    balance = project.balance_due_paise
    if balance > 0:
        add_task(project, "collect_balance", f"Collect balance {inr(balance)} from {project.customer.name}", "accounts",
                 due_in=timedelta(days=7))
    for t in project.tasks.filter(kind="subsidy", status=Task.Status.BLOCKED):
        t.status = Task.Status.OPEN
        t.due_at = clock.now() + timedelta(days=14)
        t.save()
    log(project, f"Install signed off by {job.signed_by}: {kw} kW in {hours} h. Final invoice {invoice.number}, balance {inr(balance)}.",
        customer_message=f"Installation complete and signed off. Your handover certificate is ready"
        + (f"; balance due {inr(balance)}." if balance else "."), actor=actor)
    notify(users_with_role("accounts"), f"Installed: {project.code}",
           f"Collect balance {inr(balance)}" if balance else "Fully paid", link=f"/app/p/{project.id}/?tab=payments")
    notify_customer(project.customer, "Installation complete", "Your handover certificate is ready", link=f"/portal/p/{project.id}/")
    message_customer(project, "installed", f"Your solar system {project.code} is installed. Your handover certificate is ready.",
                     path=f"/portal/p/{project.id}/")
    from .accounts import maybe_complete
    maybe_complete(project)
    return job
