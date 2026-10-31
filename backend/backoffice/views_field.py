"""Field service: My day, survey form (T3), install form (T12), delivery confirmation (T11), schedule board."""
from datetime import timedelta
from urllib.parse import quote as urlquote

from core.api import page

from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.views.decorators.http import require_POST

from core import clock, rules
from core.forms import to_dt, to_int
from core.models import Dispatch, InstallJob, JobAssignment, Photo, Survey, Ticket
from core.rules import RuleError
from core.utils import next_working_day

from .utils import run, staff_required

FIELD = ("technician", "engineer")


def _maps(address, project=None):
    return project.maps_url if project else f"https://www.google.com/maps/search/?api=1&query={urlquote(address or '')}"


def _items(user):
    """Everything on someone's plate, as uniform dicts."""
    mine = user.role == "technician"
    items = []
    surveys = Survey.objects.filter(status="requested").select_related("project__customer", "assignee")
    jobs = InstallJob.objects.filter(status="scheduled").select_related("project__customer").prefetch_related("assignments__technician")
    tickets = Ticket.objects.exclude(status__in=["closed", "resolved"]).select_related("customer", "project", "serial__product", "assignee")
    deliveries = Dispatch.objects.filter(status="dispatched").select_related("project__customer")
    if mine:
        surveys = surveys.filter(assignee=user)
        jobs = jobs.filter(assignments__technician=user)
        tickets = tickets.filter(assignee=user)
        deliveries = deliveries.filter(project__job__assignments__technician=user)
    for s in surveys:
        c = s.project.customer
        items.append({"kind": "Survey", "date": s.scheduled_for, "title": s.project.title, "customer": c, "address": s.project.site_address,
                      "who": s.assignee.display_name if s.assignee else "unassigned", "url": f"/app/field/survey/{s.id}/", "cta": "Start survey",
                      "confirmed": bool(s.customer_confirmed_at), "reschedule": s.reschedule_request, "project": s.project, "maps": _maps(s.project.site_address, s.project)})
    for j in jobs.distinct():
        p = j.project
        ready = p.stage == "delivered"
        items.append({"kind": "Install", "date": j.scheduled_date, "title": p.title, "customer": p.customer, "address": p.site_address,
                      "who": ", ".join(a.technician.first_name for a in j.assignments.all()), "url": f"/app/field/install/{j.id}/" if ready else "",
                      "cta": "Open install form" if ready else "Waiting for delivery", "confirmed": bool(j.customer_confirmed_at),
                      "reschedule": j.reschedule_request, "project": p, "maps": _maps(p.site_address, p)})
    for t in tickets:
        items.append({"kind": "Service", "date": t.visit_date, "title": f"{t.code}: {t.serial.product.name if t.serial else 'service visit'}",
                      "customer": t.customer, "address": t.project.site_address if t.project else t.customer.address,
                      "who": t.assignee.first_name if t.assignee else "unassigned", "url": f"/app/help/tickets/{t.id}/", "cta": "Open ticket",
                      "confirmed": False, "reschedule": "", "project": t.project, "maps": _maps(t.customer.address, t.project), "badge": t.get_status_display()})
    for d in deliveries.distinct():
        items.append({"kind": "Delivery", "date": d.dispatched_at.date() if d.dispatched_at else clock.today(), "title": f"{d.code} for {d.project.title}",
                      "customer": d.project.customer, "address": d.project.site_address, "who": d.driver_name or "driver",
                      "url": f"/app/field/delivery/{d.id}/", "cta": "Confirm delivery", "confirmed": False, "reschedule": "",
                      "project": d.project, "maps": _maps(d.project.site_address, d.project)})
    items.sort(key=lambda i: (i["date"] or clock.today(), i["kind"]))
    return items


def _group(items):
    today = clock.today()
    groups = {}
    for i in items:
        d = i["date"] or today
        label = "Overdue" if d < today else "Today" if d == today else "Tomorrow" if d == today + timedelta(days=1) else f"{d:%A %d %b}"
        groups.setdefault(label, []).append(i)
    return list(groups.items())


@staff_required(*FIELD)
def my_day(request):
    items = _items(request.user)
    return page(request, "backoffice/field_home.html", {"groups": _group(items), "n": len(items), "everyone": request.user.role != "technician"})


# ------------------------------------------------------------------ survey form (T3)
def _can_work(user, assignee_ids):
    return user.role in ("engineer", "director") or user.id in assignee_ids


@staff_required(*FIELD)
def survey_form(request, pk):
    s = get_object_or_404(Survey.objects.select_related("project__customer", "assignee"), pk=pk)
    if not _can_work(request.user, [s.assignee_id]):
        messages.error(request, "This survey is assigned to someone else.")
        return redirect("/app/field/")
    if s.status != "requested":
        messages.info(request, "This survey has already been submitted.")
        return redirect("/app/field/")
    if request.method == "POST":
        post = request.POST
        ok, _ = run(request, rules.submit_survey, request.user, s, roof_direction=post.get("direction", ""), tilt_deg=post.get("tilt"),
                    roof_type=post.get("roof", ""), usable_area_sqft=to_int(post.get("area")), cable_run_m=to_int(post.get("cable")),
                    shading=post.get("shading", ""), notes=post.get("notes", ""), ok="Survey submitted. The engineer has been notified.")
        if ok:
            return redirect("/app/field/")
    return page(request, "backoffice/survey_form.html", {
        "s": s, "p": s.project, "form": request.POST, "directions": [d for d, _ in Survey.DIRECTIONS],
        "photos": s.photos.all(), "need": 2})


# ------------------------------------------------------------------ install form (T12)
@staff_required(*FIELD)
def install_form(request, pk):
    job = get_object_or_404(InstallJob.objects.select_related("project__customer"), pk=pk)
    p = job.project
    crew = list(job.assignments.select_related("technician"))
    if not _can_work(request.user, [a.technician_id for a in crew]):
        messages.error(request, "This job is assigned to another crew.")
        return redirect("/app/field/")
    if job.status == "signed_off":
        messages.info(request, "This job is already signed off.")
        return redirect(f"/app/p/{p.id}/?tab=install")
    start_step = 0
    if request.method == "POST":
        post = request.POST
        ok, _ = run(
            request, rules.complete_install, request.user, job, started_at=to_dt(post.get("started_at")),
            finished_at=to_dt(post.get("finished_at")), kw_confirmed=post.get("kw") or None, kw_note=post.get("kw_note", ""),
            checks={k: bool(post.get(k)) for k, _ in rules.CHECKS}, test_reading_kw=post.get("reading") or None,
            present_ids=[int(x) for x in post.getlist("present") if x.isdigit()], signed_by=post.get("signed_by", ""),
            signature=post.get("signature", ""), geo_lat=post.get("geo_lat") or None, geo_lng=post.get("geo_lng") or None,
            notes=post.get("notes", ""), ok="Install signed off. The handover certificate is ready.")
        if ok:
            return redirect(f"/app/p/{p.id}/?tab=install")
        start_step = 3
    now = timezone.localtime(clock.now())
    quote = p.accepted_quote
    return page(request, "backoffice/install_form.html", {
        "job": job, "p": p, "crew": crew, "checks": rules.CHECKS, "form": request.POST, "start_step": start_step,
        "quoted_kw": quote.kw if quote else p.requested_kw, "photos": job.photos.all(), "need": 4,
        "default_start": (now - timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M"), "default_end": now.strftime("%Y-%m-%dT%H:%M"),
        "kinds": [("array", "Roof array"), ("inverter", "Inverter + boxes"), ("earthing", "Earthing"), ("display", "Inverter display")]})


@staff_required(*FIELD, "warehouse")
def delivery(request, pk):
    d = get_object_or_404(Dispatch.objects.select_related("project__customer"), pk=pk)
    if request.method == "POST":
        ok, _ = run(request, rules.confirm_delivery, request.user, d, request.POST.get("received_by", ""),
                    ok="Delivery confirmed. Warranty has started on every serial number.")
        if ok:
            return redirect("/app/field/")
    groups = {}
    for line in d.lines.select_related("product"):
        groups[line.product_id] = {"product": line.product, "qty": line.qty_picked, "serials": []}
    for s in d.serials.select_related("product"):
        groups.setdefault(s.product_id, {"product": s.product, "qty": 0, "serials": []})["serials"].append(s.serial_no)
    return page(request, "backoffice/delivery.html", {"d": d, "p": d.project, "groups": groups.values()})


# ------------------------------------------------------------------ photos (shared by survey and install forms)
@staff_required(*FIELD)
@require_POST
def photo_upload(request):
    f = request.FILES.get("file")
    target, pk, kind = request.POST.get("target"), request.POST.get("id"), request.POST.get("kind", "")
    if f is None or not (f.content_type or "").startswith("image/"):
        return JsonResponse({"ok": False, "error": "Choose an image file."}, status=400)
    if f.size > 12 * 1024 * 1024:
        return JsonResponse({"ok": False, "error": "That photo is too large (12 MB max)."}, status=400)
    if target == "survey":
        s = get_object_or_404(Survey, pk=pk)
        if s.status != "requested" or not _can_work(request.user, [s.assignee_id]):
            return JsonResponse({"ok": False, "error": "You cannot add photos to this survey."}, status=403)
        ph = Photo.objects.create(project=s.project, survey=s, kind=kind or "survey", file=f, uploaded_by=request.user)
    elif target == "job":
        j = get_object_or_404(InstallJob, pk=pk)
        if j.status != "scheduled" or not _can_work(request.user, list(j.assignments.values_list("technician_id", flat=True))):
            return JsonResponse({"ok": False, "error": "You cannot add photos to this job."}, status=403)
        ph = Photo.objects.create(project=j.project, job=j, kind=kind or "install", file=f, uploaded_by=request.user)
    else:
        return JsonResponse({"ok": False, "error": "Unknown target."}, status=400)
    return JsonResponse({"ok": True, "url": ph.file.url, "kind": ph.kind})


# ------------------------------------------------------------------ coordinator schedule board
@staff_required("engineer")
def schedule(request):
    today = clock.today()
    days = []
    d = next_working_day(today)
    while len(days) < 7:
        days.append(d)
        d = next_working_day(d + timedelta(days=1))
    board = []
    for day in days:
        board.append({
            "day": day,
            "surveys": Survey.objects.filter(status="requested", scheduled_for=day).select_related("project__customer", "assignee"),
            "installs": InstallJob.objects.filter(status="scheduled", scheduled_date=day).select_related("project__customer").prefetch_related("assignments__technician"),
            "visits": Ticket.objects.filter(visit_date=day).exclude(status__in=["closed", "resolved"]).select_related("customer", "assignee"),
        })
    requests_ = {
        "surveys": Survey.objects.filter(status="requested").exclude(reschedule_request="").select_related("project__customer"),
        "jobs": InstallJob.objects.filter(status="scheduled").exclude(reschedule_request="").select_related("project__customer"),
    }
    return page(request, "backoffice/schedule.html", {"board": board, "reqs": requests_})
