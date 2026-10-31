"""T1 enquiry, T2 qualification, mark-lost, T4 survey review."""
import re
from dataclasses import dataclass, field
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .. import clock, config
from ..calc import qualify
from ..calc.schedule import pick_technicians
from ..models import Customer, Project, Role, Survey, Task, User
from ..money import inr
from ..utils import new_token, normalize_phone
from .common import (RuleError, add_task, close_tasks, log, message_customer, notify, notify_customer,
                     require_role, set_stage, users_with_role)

OPEN_STAGES = [Project.Stage.ENQUIRY, Project.Stage.QUALIFIED, Project.Stage.SURVEY, Project.Stage.QUOTING, Project.Stage.QUOTED]


@dataclass
class EnquiryResult:
    project: Project
    customer: Customer
    user: User | None = None      # set only when this call created a portal login
    repeat: bool = False
    new_customer: bool = False    # True only when this call created the Customer record


def _least_loaded_sales():
    sales = users_with_role(Role.SALES)
    if not sales:
        return None
    return min(sales, key=lambda u: (Project.objects.filter(owner=u, stage__in=OPEN_STAGES).count(), u.id))


def request_survey(project, start=None):
    """Create a survey request and auto-assign the least-loaded surveyor to the next free day."""
    day, techs = pick_technicians((start or clock.today()) + timedelta(days=1), 1, "survey")
    tech = techs[0] if techs else None
    survey = Survey.objects.create(project=project, assignee=tech, scheduled_for=day)
    if tech:
        notify(tech, f"Survey: {project.code}", f"{project.customer.name}, {day:%d %b}", link=f"/app/field/survey/{survey.id}/")
    return survey


# ------------------------------------------------------------------ T1
@transaction.atomic
def submit_enquiry(*, name, phone, address, pincode, kind, segment="home", requested_kw=3, email="", city="",
                   subsidy_interest=False, declared=None, preferred_call_time="", notes="", password="",
                   source="portal", actor=None, honeypot="", require_account=False, site_lat=None, site_lng=None,
                   require_location=False):
    if honeypot:
        raise RuleError("Could not submit the form.")
    name = (name or "").strip()
    address = (address or "").strip()
    pincode = re.sub(r"\D", "", pincode or "")
    phone_n = normalize_phone(phone)
    if not name:
        raise RuleError("Please enter your name.")
    if not phone_n:
        raise RuleError("Enter a valid 10-digit mobile number.")
    if kind not in Project.Kind.values:
        raise RuleError("Choose a package.")
    kw = int(requested_kw or 3)
    if not 1 <= kw <= 5:
        raise RuleError("Choose a capacity between 1 and 5 kW.")
    if password and len(password) < 6:
        raise RuleError("Choose a password of at least 6 characters.")
    if require_account and not password:
        raise RuleError("Create a password to set up your customer account.")
    if site_lat in (None, "") and site_lng in (None, ""):
        site_lat = site_lng = None
    else:
        try:
            site_lat, site_lng = Decimal(str(site_lat)), Decimal(str(site_lng))
            if not site_lat.is_finite() or not site_lng.is_finite() or not -90 <= site_lat <= 90 or not -180 <= site_lng <= 180:
                raise ValueError
            site_lat, site_lng = (v.quantize(Decimal("0.000001")) for v in (site_lat, site_lng))
        except (InvalidOperation, ValueError, TypeError):
            raise RuleError("Choose a valid location on the map.")
    if require_location:
        if site_lat is None:
            raise RuleError("Choose your installation location on the map before sending your enquiry.")
        address = address or f"Map location: {site_lat}, {site_lng}"
    if not address:
        raise RuleError("Please enter the installation address.")
    if len(pincode) != 6 and (pincode or not require_location):
        raise RuleError("Enter a 6-digit pincode.")

    if require_account and Customer.objects.filter(phone=phone_n).exists():
        raise RuleError("This mobile number already has a customer record. Log in, or use your account activation link.")

    customer, created = Customer.objects.get_or_create(
        phone=phone_n, defaults=dict(name=name, email=email, address=address, city=city, pincode=pincode, created_at=clock.now()))
    if not created:  # fill blanks only; never overwrite what we already know
        changed = False
        for fld, val in (("email", email), ("address", address), ("city", city), ("pincode", pincode)):
            if val and not getattr(customer, fld):
                setattr(customer, fld, val)
                changed = True
        if changed:
            customer.save()

    new_user = None
    if password and customer.user_id is None:
        if not created:
            raise RuleError("Use your account activation link to create a password for this mobile number.")
        first, _, last = name.partition(" ")
        username = phone_n if not User.objects.filter(username=phone_n).exists() else f"c{phone_n}"
        new_user = User.objects.create_user(
            username=username, password=password, first_name=first, last_name=last, email=email,
            phone=phone_n, role=Role.CUSTOMER)
        customer.user = new_user
        customer.claimed_at = clock.now()
        customer.claim_token = ""
        customer.save()
    elif customer.user_id is None and not customer.claim_token:
        customer.claim_token = new_token()
        customer.invited_at = clock.now()
        customer.save()

    source_label = dict(Project.Source.choices).get(source, source)
    open_projects = customer.projects.filter(stage__in=OPEN_STAGES, kind=kind)
    if require_location:
        open_projects = open_projects.filter(site_lat=site_lat, site_lng=site_lng)
    existing = open_projects.order_by("-created_at").first()
    if existing and (clock.now() - existing.created_at) < timedelta(days=30):
        log(existing, f"Repeat enquiry received via {source_label}; attached to this project.", actor=actor)
        notify(existing.owner, f"Repeat enquiry: {existing.code}", customer.name, link=f"/app/p/{existing.id}/")
        return EnquiryResult(existing, customer, new_user, repeat=True, new_customer=created)

    owner = _least_loaded_sales()
    project = Project.objects.create(
        customer=customer, submitted_by=actor or new_user, kind=kind, segment=segment, requested_kw=kw,
        subsidy_interest=bool(subsidy_interest), source=source, owner=owner, site_address=address,
        declared=declared or {}, preferred_call_time=preferred_call_time, notes=notes, created_at=clock.now(),
        stage_since=clock.now(), site_lat=site_lat, site_lng=site_lng)
    mins = config.get("first_call_minutes")
    add_task(project, "first_call", "First call: verify roof space, bill and grid", "sales", due_in=timedelta(minutes=mins))
    log(project, f"Enquiry received via {source_label}: {project.title}.",
        customer_message=f"Enquiry received. Your reference is {project.code}. We'll call you within {mins} minutes.", actor=actor)
    notify(owner, f"New enquiry {project.code}", f"{customer.name}: {project.title}", link=f"/app/p/{project.id}/")
    message_customer(project, "enquiry_received",
                     f"Hi {customer.name.split(' ')[0]}, we received your enquiry {project.code} for a {project.title} system. "
                     f"We'll call you within {mins} minutes.", path="/portal/")
    return EnquiryResult(project, customer, new_user, new_customer=created)


# ------------------------------------------------------------------ lost
@transaction.atomic
def mark_lost(actor, project, reason):
    require_role(actor, "sales", "engineer")
    reason = (reason or "").strip()
    if not reason:
        raise RuleError("Give a reason before marking an enquiry as lost.")
    if project.stage in (Project.Stage.ORDERED, Project.Stage.DISPATCHED, Project.Stage.DELIVERED,
                         Project.Stage.INSTALLED, Project.Stage.COMPLETED, Project.Stage.LOST):
        raise RuleError("An order that is already confirmed cannot be marked lost.")
    project.lost_reason = reason[:200]
    project.save(update_fields=["lost_reason"])
    set_stage(project, Project.Stage.LOST)
    project.tasks.filter(status__in=["open", "blocked"]).update(status=Task.Status.NA)
    project.quotes.filter(status__in=["draft", "sent"]).update(status="rejected")
    log(project, f"Marked lost: {reason}", customer_message="This enquiry has been closed. You can send a new one any time.", actor=actor)


# ------------------------------------------------------------------ T2
@dataclass
class QualResult:
    passed: bool
    reasons: list[str] = field(default_factory=list)
    suggested_kw: int | None = None
    max_kw: int | None = None
    survey: Survey | None = None


@transaction.atomic
def record_qualification(actor, project, *, area_sqft=None, bill_paise=None, phase="", load_kw=None, discom="",
                         notes="", requested_kw=None):
    require_role(actor, "sales")
    if project.stage != Project.Stage.ENQUIRY:
        raise RuleError("This enquiry has already been qualified.")
    panelset = project.kind == Project.Kind.PANELSET
    if requested_kw:
        if not 1 <= int(requested_kw) <= 5:
            raise RuleError("Capacity must be between 1 and 5 kW.")
        project.requested_kw = int(requested_kw)
    if not panelset:
        if not area_sqft or int(area_sqft) <= 0:
            raise RuleError("Enter the shadow-free roof area confirmed on the call.")
        if not bill_paise or int(bill_paise) <= 0:
            raise RuleError("Enter the monthly electricity bill.")
        if phase not in ("single", "three"):
            raise RuleError("Choose the grid phase (single or three).")
        if project.kind == Project.Kind.ONGRID and (load_kw in (None, "") or float(load_kw) <= 0):
            raise RuleError("Enter the sanctioned load in kW.")

    project.verified_area_sqft = int(area_sqft) if area_sqft else None
    project.verified_bill_paise = int(bill_paise) if bill_paise else None
    project.verified_phase = phase
    project.verified_load_kw = load_kw if load_kw not in (None, "") else None
    project.verified_discom = (discom or "").strip()
    project.qualification_notes = notes
    project.qualified_by = actor
    project.qualified_at = clock.now()
    project.save()
    close_tasks(project, "first_call")

    declared_area = (project.declared or {}).get("area_sqft")
    if declared_area and area_sqft and int(declared_area) != int(area_sqft):
        log(project, f"Customer said {declared_area} sq ft of roof; verified {area_sqft} sq ft.", actor=actor)

    result = QualResult(True)
    if not panelset:
        result.suggested_kw = qualify.suggested_kw(int(bill_paise))
        result.reasons = qualify.feasibility(project.kind, project.requested_kw, int(area_sqft), load_kw, project.verified_discom)
        result.passed = not result.reasons
        result.max_kw = qualify.max_kw_that_fits(int(area_sqft), load_kw, project.kind == Project.Kind.ONGRID)

    if not result.passed:
        log(project, "Qualification failed: " + " ".join(result.reasons), actor=actor)
        return result

    if panelset:  # hardware-only sale: no roof survey needed
        set_stage(project, Project.Stage.QUOTING)
        log(project, "Qualified (hardware only, no survey needed).",
            customer_message="Thanks for the call. We're preparing your quote.", actor=actor)
        return result

    survey = request_survey(project)
    result.survey = survey
    set_stage(project, Project.Stage.QUALIFIED)
    when = f"{survey.scheduled_for:%a %d %b}"
    log(project, f"Qualified. Survey requested for {when}"
        + (f", assigned to {survey.assignee.display_name}." if survey.assignee else " (no surveyor available)."),
        customer_message=f"Eligibility check passed. Site survey planned for {when}.", actor=actor)
    notify_customer(project.customer, "Survey planned", f"Site survey on {when}", link=f"/portal/p/{project.id}/")
    message_customer(project, "survey_planned",
                     f"Your site survey for {project.code} is planned for {when}. Please confirm the slot in your account.",
                     path=f"/portal/p/{project.id}/")
    return result


# ------------------------------------------------------------------ T4
@transaction.atomic
def review_survey(actor, survey, approve, note=""):
    require_role(actor, "engineer")
    if survey.status != Survey.Status.DONE:
        raise RuleError("This survey has not been submitted yet.")
    project = survey.project
    note = (note or "").strip()
    if not approve and not note:
        raise RuleError("Add a reason for rejecting the survey.")
    survey.reviewed_by = actor
    survey.reviewed_at = clock.now()
    survey.review_note = note[:300]
    if approve:
        survey.status = Survey.Status.APPROVED
        survey.save()
        set_stage(project, Project.Stage.QUOTING)
        log(project, "Survey approved. Quote unlocked.",
            customer_message="Survey approved. We're preparing your quote.", actor=actor)
        notify(project.owner, f"Survey approved: {project.code}", "You can now build the quote.", link=f"/app/p/{project.id}/?tab=quote")
        return None
    survey.status = Survey.Status.REJECTED
    survey.save()
    set_stage(project, Project.Stage.QUALIFIED)
    new = request_survey(project)
    log(project, f"Survey rejected: {note}. New survey requested.",
        customer_message=f"We need to revisit your roof. New survey planned for {new.scheduled_for:%a %d %b}.", actor=actor)
    return new
