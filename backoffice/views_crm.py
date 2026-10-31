"""Staff home, CRM pipeline, quick-add enquiry and the project page with all its actions."""
from datetime import timedelta

from django.contrib import messages
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from core import clock, config, rules
from core.calc import pricing, qualify
from core.calc.finance import project_financials, quote_margin
from core.calc.nextaction import next_action, stuck_info
from core.forms import enquiry_kwargs, to_int, to_paise
from core.models import Category, Dispatch, Payment, Product, Project, Quote, Survey, Task, Ticket
from core.money import inr
from core.rules import RuleError

from .utils import back, run, staff_required

COLUMNS = ["enquiry", "qualified", "survey", "quoting", "quoted", "accepted", "ordered", "dispatched", "delivered", "installed"]
FAR = clock.now() + timedelta(days=3650)


# ------------------------------------------------------------------ home
def role_queue(user):
    """A few numbers that matter to this role today, each linking to where to act."""
    role = user.role
    open_stages = ["enquiry", "qualified", "survey", "quoting", "quoted"]
    q = []
    if role in ("sales", "director"):
        mine = Project.objects.filter(stage__in=open_stages) if role == "director" else Project.objects.filter(owner=user, stage__in=open_stages)
        q += [("Open leads", mine.count(), "/app/crm/" + ("" if role == "director" else "?owner=me")),
              ("First calls overdue", Task.objects.filter(kind="first_call", status="open", due_at__lt=clock.now()).count(), "/app/crm/?stage=enquiry&view=list"),
              ("Quotes awaiting reply", Project.objects.filter(stage="quoted").count(), "/app/crm/?stage=quoted&view=list")]
    if role in ("engineer", "director"):
        q += [("Surveys to review", Survey.objects.filter(status="done").count(), "/app/crm/?stage=survey&view=list"),
              ("Reschedule requests", Survey.objects.exclude(reschedule_request="").filter(status="requested").count(), "/app/field/schedule/")]
    if role in ("warehouse", "director"):
        q += [("Pick lists open", Dispatch.objects.filter(status__in=["to_pick", "ready"]).count(), "/app/inventory/dispatch/"),
              ("Waiting for stock", Dispatch.objects.filter(status="awaiting_stock").count(), "/app/inventory/")]
    if role in ("technician",):
        q += [("Jobs assigned to me", _my_job_count(user), "/app/field/")]
    if role in ("support", "director"):
        q += [("Open tickets", Ticket.objects.exclude(status="closed").count(), "/app/help/tickets/"),
              ("Awaiting customer", Ticket.objects.filter(status="resolved").count(), "/app/help/tickets/?status=resolved")]
    if role in ("accounts", "director"):
        q += [("Payments to verify", Payment.objects.filter(status="pending").count(), "/app/accounts/"),
              ("Subsidy steps open", Task.objects.filter(kind="subsidy", status="open").count(), "/app/accounts/?tab=subsidy")]
    return q


def _my_job_count(user):
    from core.models import JobAssignment
    return (Survey.objects.filter(assignee=user, status="requested").count()
            + JobAssignment.objects.filter(technician=user, job__status="scheduled").count()
            + Ticket.objects.filter(assignee=user).exclude(status__in=["closed", "resolved"]).count())


@staff_required()
def home(request):
    u = request.user
    tasks = Task.objects.filter(status="open").select_related("project__customer")
    if u.role != "director":
        tasks = tasks.filter(owner_role=u.role)
    tasks = sorted(tasks, key=lambda t: (not t.overdue, t.due_at or FAR))[:12]
    return render(request, "backoffice/home.html", {"queue": role_queue(u), "tasks": tasks, "notes": u.notifications.all()[:6]})


# ------------------------------------------------------------------ pipeline
def _card(p):
    return {"p": p, "next": next_action(p), "stuck": stuck_info(p)}


@staff_required("sales", "engineer", "accounts", "support")
def pipeline(request):
    q = request.GET.get("q", "").strip()
    owner = request.GET.get("owner", "all")
    view = request.GET.get("view", "board")
    stage = request.GET.get("stage", "")
    qs = Project.objects.select_related("customer", "owner")
    if q:
        qs = qs.filter(Q(code__icontains=q) | Q(customer__name__icontains=q) | Q(customer__phone__icontains=q))
    if owner == "me":
        qs = qs.filter(owner=request.user)
    ctx = {"q": q, "owner": owner, "view": view, "stage": stage, "stages": Project.Stage.choices,
           "n_completed": qs.filter(stage="completed").count(), "n_lost": qs.filter(stage="lost").count()}
    if view == "list" or stage in ("completed", "lost"):
        if stage:
            qs = qs.filter(stage=stage)
        ctx.update(view="list", rows=[_card(p) for p in qs[:200]])
    else:
        cols = []
        for s in COLUMNS:
            items = [_card(p) for p in qs.filter(stage=s)]
            cols.append({"key": s, "label": dict(Project.Stage.choices)[s], "cards": items})
        ctx["cols"] = cols
    return render(request, "backoffice/pipeline.html", ctx)


@staff_required("sales", "support")
def quick_add(request):
    if request.method == "POST":
        kw = enquiry_kwargs(request.POST)
        kw["password"] = ""
        src = request.POST.get("source", "call")
        ok, res = run(request, rules.submit_enquiry, source=src, actor=request.user, **kw)
        if ok:
            messages.success(request, f"Enquiry {res.project.code} logged" + (" (repeat enquiry attached to the open project)." if res.repeat else "."))
            return redirect(f"/app/p/{res.project.id}/")
    return render(request, "backoffice/quick_add.html", {"form": request.POST})


# ------------------------------------------------------------------ project page
TABS = [("overview", "Overview"), ("qualification", "Qualification"), ("survey", "Survey"), ("quote", "Quote"),
        ("payments", "Payments"), ("dispatch", "Dispatch"), ("install", "Install"), ("tickets", "Tickets"),
        ("subsidy", "Tasks and subsidy"), ("timeline", "Timeline")]


def _declared(p):
    """What the customer told us, with every key present so templates can use it as a filter argument."""
    d = p.declared or {}
    return {k: d.get(k, "") for k in ("area_sqft", "monthly_bill", "roof_type", "load_kw", "discom")}


def _tab_overview(request, p):
    ctx = {"na": next_action(p), "stuck": stuck_info(p), "recent": p.timeline.all()[:6], "last_message": p.messages.first(),
           "declared": _declared(p)}
    if request.user.role in ("director", "accounts"):
        ctx["fin"] = project_financials(p)
    return ctx


def _tab_qualification(request, p):
    reasons, max_kw, suggested = [], None, None
    if p.verified_area_sqft and p.kind != "panelset":
        reasons = qualify.feasibility(p.kind, p.requested_kw, p.verified_area_sqft, p.verified_load_kw, p.verified_discom)
        max_kw = qualify.max_kw_that_fits(p.verified_area_sqft, p.verified_load_kw, p.kind == "ongrid")
        suggested = qualify.suggested_kw(p.verified_bill_paise) if p.verified_bill_paise else None
    return {"declared": _declared(p), "reasons": reasons, "max_kw": max_kw, "suggested": suggested,
            "need_area": qualify.required_area(p.requested_kw), "can_qualify": p.stage == "enquiry"}


def _tab_survey(request, p):
    return {"surveys": p.surveys.prefetch_related("photos").select_related("assignee"),
            "can_review": request.user.role in ("engineer", "director")}


def _tab_quote(request, p):
    quote = p.latest_quote
    template = pricing.default_template(p.kind, p.requested_kw)
    gate = ""
    can_build = quote is None or quote.status in ("sent", "rejected")
    if can_build:
        if template is None:
            gate = f"There is no kit template for {p.title}."
        elif template.requires_survey and not p.surveys.filter(status="approved").exists():
            gate = "Survey must be approved before a quote can be created."
        elif p.stage in ("accepted", "ordered", "dispatched", "delivered", "installed", "completed", "lost"):
            gate = "This project already has an accepted order or is closed."
        elif p.stage == "enquiry":
            gate = "Qualify the enquiry first."
    ctx = {"quote": quote, "template": template, "gate": gate, "can_build": can_build,
           "max_discount": config.get("max_discount_pct"), "is_draft": bool(quote and quote.status == "draft")}
    if quote:
        lines = list(quote.lines.select_related("product"))
        present = {l.category for l in lines}
        required = []
        if quote.template_id:
            cats = dict(Category.choices)
            for c in sorted(set(quote.template.lines.exclude(required_category="").values_list("required_category", flat=True))):
                required.append({"label": cats.get(c, c), "ok": c in present})
        ctx.update(lines=lines, required=required, missing=[r["label"] for r in required if not r["ok"]],
                   margin=quote_margin(quote), discount_paise=quote.gross_paise - quote.subtotal_paise,
                   addable=Product.objects.filter(active=True).exclude(pk__in=[l.product_id for l in lines if l.product_id]))
    return ctx


def _tab_payments(request, p):
    paid = p.confirmed_paid_paise
    due = p.balance_due_paise
    advance_due = max(p.advance_required_paise - paid, 0) if p.stage == "accepted" else 0
    default = advance_due or due
    return {"payments": p.payments.select_related("submitted_by", "verified_by"), "invoices": p.invoices.all(), "paid": paid,
            "due": due, "advance_due": advance_due, "total": p.total_due_paise, "default_rupees": default // 100 if default else "",
            "can_record": request.user.role in ("accounts", "sales", "director"), "can_verify": request.user.role in ("accounts", "director")}


def _tab_dispatch(request, p):
    return {"dispatches": p.dispatches.prefetch_related("lines__product")}


def _tab_install(request, p):
    job = getattr(p, "job", None)
    return {"job": job, "assignments": job.assignments.select_related("technician") if job else [],
            "photos": job.photos.all() if job else []}


def _tab_tickets(request, p):
    return {"tickets": p.tickets.select_related("serial__product", "assignee")}


def _tab_subsidy(request, p):
    return {"tasks": p.tasks.exclude(kind="subsidy"), "subsidy": p.tasks.filter(kind="subsidy"),
            "can_act": request.user.role in ("accounts", "sales", "engineer", "director")}


def _tab_timeline(request, p):
    return {"events": p.timeline.select_related("actor")[:150], "messages_log": p.messages.all()[:10]}


TAB_BUILDERS = {"overview": _tab_overview, "qualification": _tab_qualification, "survey": _tab_survey, "quote": _tab_quote,
                "payments": _tab_payments, "dispatch": _tab_dispatch, "install": _tab_install, "tickets": _tab_tickets,
                "subsidy": _tab_subsidy, "timeline": _tab_timeline}


@staff_required()
def project_detail(request, pk):
    p = get_object_or_404(Project.objects.select_related("customer", "owner"), pk=pk)
    tab = request.GET.get("tab", "overview")
    if tab not in TAB_BUILDERS:
        raise Http404()
    ctx = {"p": p, "tab": tab, "tabs": TABS, "tab_template": f"backoffice/tabs/{tab}.html"}
    ctx.update(TAB_BUILDERS[tab](request, p))
    ctx.setdefault("na", next_action(p))
    ctx.setdefault("stuck", stuck_info(p))
    return render(request, "backoffice/project.html", ctx)


# ------------------------------------------------------------------ actions (each calls exactly one workflow rule)
def a_qualify(request, p):
    post = request.POST
    ok, res = run(request, rules.record_qualification, request.user, p, area_sqft=to_int(post.get("area")),
                  bill_paise=to_paise(post.get("bill")), phase=post.get("phase", ""), load_kw=post.get("load") or None,
                  discom=post.get("discom", ""), notes=post.get("notes", ""), requested_kw=to_int(post.get("kw")))
    if ok:
        if res.passed:
            when = f" Survey planned for {res.survey.scheduled_for:%a %d %b}." if res.survey else ""
            messages.success(request, "Qualified." + when + (f" The bill suggests about {res.suggested_kw} kW." if res.suggested_kw else ""))
        else:
            messages.warning(request, "Not feasible as requested: " + " ".join(res.reasons)
                             + (f" A {res.max_kw} kW system would fit." if res.max_kw else ""))
    return "qualification"


def a_lost(request, p):
    run(request, rules.mark_lost, request.user, p, request.POST.get("reason", ""), ok="Marked as lost.")
    return "overview"


def a_invite(request, p):
    ok, _ = run(request, rules.invite_customer, request.user, p.customer, ok="Portal invitation prepared. Open it from Messages to send on WhatsApp.")
    return "timeline" if ok else "overview"


def a_quote_build(request, p):
    ok, q = run(request, rules.build_quote, request.user, p, discount_pct=request.POST.get("discount") or 0,
                ok="Quote drafted from the kit template and the survey.")
    return "quote"


def _draft(p):
    q = p.latest_quote
    if q is None:
        raise RuleError("There is no quote yet.")
    return q


def a_quote_update(request, p):
    try:
        q = _draft(p)
        qty = {int(k[4:]): v for k, v in request.POST.items() if k.startswith("qty_")}
        rules.quote_update_lines(request.user, q, qty)
        rules.quote_set_discount(request.user, q, request.POST.get("discount") or 0)
        messages.success(request, "Quote updated.")
    except RuleError as e:
        messages.error(request, e.message)
    return "quote"


def a_quote_add(request, p):
    try:
        q = _draft(p)
        product = get_object_or_404(Product, pk=request.POST.get("product"))
        rules.quote_add_line(request.user, q, product, request.POST.get("qty") or 1)
        messages.success(request, f"{product.name} added.")
    except RuleError as e:
        messages.error(request, e.message)
    return "quote"


def a_quote_remove(request, p):
    try:
        rules.quote_remove_line(request.user, _draft(p), int(request.POST.get("line", 0)))
        messages.success(request, "Line removed.")
    except RuleError as e:
        messages.error(request, e.message)
    return "quote"


def a_quote_reset(request, p):
    try:
        rules.quote_reset(request.user, _draft(p))
        messages.success(request, "Quote reset to the kit template.")
    except RuleError as e:
        messages.error(request, e.message)
    return "quote"


def a_quote_send(request, p):
    try:
        q = _draft(p)
        rules.send_quote(request.user, q, request.POST.get("override_reason", ""))
        messages.success(request, "Quote sent. The customer can review it in their account.")
    except RuleError as e:
        messages.error(request, e.message)
    return "quote"


def a_quote_accept(request, p):
    try:
        q = p.quotes.get(status="sent")
        rules.accept_quote(request.user, q, request.POST.get("name", ""), request.POST.get("note", ""))
        messages.success(request, "Quote accepted on the customer's behalf. Collect the advance next.")
    except Quote.DoesNotExist:
        messages.error(request, "There is no sent quote to accept.")
    except RuleError as e:
        messages.error(request, e.message)
    return "payments"


def a_survey_review(request, p):
    survey = get_object_or_404(Survey, pk=request.POST.get("survey"), project=p)
    approve = request.POST.get("decision") == "approve"
    ok, _ = run(request, rules.review_survey, request.user, survey, approve, request.POST.get("note", ""),
                ok="Survey approved. The quote is unlocked." if approve else "Survey rejected. A new survey has been requested.")
    return "survey"


def a_payment_record(request, p):
    post = request.POST
    ok, res = run(request, rules.record_payment, request.user, p, to_paise(post.get("amount")) or 0, post.get("method", "upi"),
                  post.get("reference", ""))
    if ok:
        (messages.success if (res.order_confirmed or not res.shortfall_paise) else messages.warning)(request, res.message)
    return "payments"


def a_payment_verify(request, p):
    pay = get_object_or_404(Payment, pk=request.POST.get("payment"), project=p)
    ok, res = run(request, rules.verify_payment, request.user, pay, request.POST.get("decision") == "approve", request.POST.get("note", ""))
    if ok:
        messages.success(request, res.message or "Payment reviewed.")
    return "payments"


def a_task_done(request, p):
    task = get_object_or_404(Task, pk=request.POST.get("task"), project=p)
    run(request, rules.complete_task, request.user, task, request.POST.get("note", ""), request.POST.get("na") == "1", ok="Marked done.")
    return "subsidy"


ACTIONS = {"qualify": a_qualify, "lost": a_lost, "invite": a_invite, "quote_build": a_quote_build, "quote_update": a_quote_update,
           "quote_add": a_quote_add, "quote_remove": a_quote_remove, "quote_reset": a_quote_reset, "quote_send": a_quote_send,
           "quote_accept": a_quote_accept, "survey_review": a_survey_review, "payment_record": a_payment_record,
           "payment_verify": a_payment_verify, "task_done": a_task_done}


@staff_required()
@require_POST
def project_action(request, pk, action):
    p = get_object_or_404(Project, pk=pk)
    handler = ACTIONS.get(action)
    if handler is None:
        raise Http404()
    tab = handler(request, p)
    return redirect(f"/app/p/{p.id}/?tab={tab}")
