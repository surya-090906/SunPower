"""Accounting (payments to verify, invoices, subsidy, payroll, costs) and the Director's insights."""
import csv
from datetime import timedelta
from urllib.parse import quote

from core.api import page

from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST

from core import clock, rules
from core.calc import insights
from core.calc.finance import project_financials
from core.forms import to_paise
from core.models import Invoice, LedgerEntry, Payment, Project, Snapshot, Task
from core.money import inr
from core.rules import RuleError
from core.utils import new_token

from .utils import run, staff_required


# ------------------------------------------------------------------ accounting
@staff_required("accounts")
def accounts(request):
    tab = request.GET.get("tab", "payments")
    ctx = {"tab": tab, "tabs": [("payments", "Payments"), ("invoices", "Invoices"), ("subsidy", "Subsidy tracker"), ("payroll", "Payroll"), ("costs", "Costs")]}
    pending = Payment.objects.filter(status="pending").select_related("project__customer", "submitted_by")
    ctx["pending_count"] = pending.count()
    if tab == "payments":
        ctx.update(pending=pending, recent=Payment.objects.filter(status="confirmed").select_related("project__customer")[:25])
    elif tab == "invoices":
        rows = [i for i in Invoice.objects.exclude(status="void").select_related("project__customer") if True]
        ctx.update(open=[i for i in rows if i.balance_paise > 0], paid=[i for i in rows if i.balance_paise == 0][:15], today=clock.today())
    elif tab == "subsidy":
        ctx["steps"] = [{"t": t, "waiting": (clock.now() - t.project.stage_since).days}
                        for t in Task.objects.filter(kind="subsidy").exclude(status__in=["done", "na"]).select_related("project__customer").order_by("project_id", "seq")]
    elif tab == "payroll":
        ctx["pay"] = insights.payroll(request.GET.get("month"))
    elif tab == "costs":
        ctx.update(entries=LedgerEntry.objects.filter(category="other").select_related("project__customer").order_by("-occurred_at")[:15],
                   projects=Project.objects.exclude(stage__in=["enquiry", "lost"]).select_related("customer")[:80])
    return page(request, "backoffice/accounts.html", ctx)


@staff_required("accounts")
@require_POST
def verify(request, pk):
    pay = get_object_or_404(Payment, pk=pk)
    ok, res = run(request, rules.verify_payment, request.user, pay, request.POST.get("decision") == "approve", request.POST.get("note", ""))
    if ok:
        messages.success(request, res.message or "Payment reviewed.")
    return redirect("/app/accounts/?tab=payments")


@staff_required("accounts")
@require_POST
def task_done(request, pk):
    task = get_object_or_404(Task, pk=pk)
    run(request, rules.complete_task, request.user, task, "", request.POST.get("na") == "1", ok="Step marked done.")
    return redirect("/app/accounts/?tab=subsidy")


@staff_required("accounts")
@require_POST
def add_cost(request):
    project = get_object_or_404(Project, pk=request.POST.get("project") or 0)
    run(request, rules.add_cost, request.user, project, to_paise(request.POST.get("amount")) or 0, request.POST.get("note", ""),
        ok="Cost added to the job.")
    return redirect("/app/accounts/?tab=costs")


@staff_required("accounts")
def payroll_csv(request):
    pay = insights.payroll(request.GET.get("month"))
    resp = HttpResponse(content_type="text/csv")
    resp["Content-Disposition"] = f'attachment; filename="payroll-{pay["month"]:%Y-%m}.csv"'
    w = csv.writer(resp)
    w.writerow(["Technician", "Jobs", "Install hours", "Service hours", "Total hours", "Rate per hour (INR)", "Amount (INR)"])
    for r in pay["rows"]:
        w.writerow([r["tech"].display_name, r["jobs"], r["install_h"], r["service_h"], r["hours"], r["rate"] / 100, r["amount"] / 100])
    w.writerow(["Total", "", "", "", pay["hours"], "", pay["total"] / 100])
    return resp


# ------------------------------------------------------------------ insights (Director)
@staff_required("accounts")
def dashboard(request):
    d = insights.dashboard(request.GET.get("window", "month"))
    ctx = {"d": d, "is_director": request.user.role == "director", "share_url": "", "wa_link": ""}
    snap = Snapshot.objects.filter(token=request.GET.get("snap", "")).first()
    if snap:
        ctx["share_url"] = request.build_absolute_uri(f"/share/{snap.token}/")
        ctx["wa_link"] = "https://wa.me/?text=" + quote(f"{snap.payload.get('text', '')} {ctx['share_url']}")
    return page(request, "backoffice/insights.html", ctx)


@staff_required("accounts")
def job_detail(request, pk):
    p = get_object_or_404(Project.objects.select_related("customer"), pk=pk)
    fin = project_financials(p)
    return page(request, "backoffice/job_profit.html", {
        "p": p, "fin": fin, "wf": insights.waterfall(fin), "ledger": p.ledger.all(),
        "tickets": p.tickets.select_related("serial__product")})


@staff_required("accounts")
@require_POST
def share(request):
    d = insights.dashboard(request.POST.get("window", "month"))
    snap = Snapshot.objects.create(token=new_token(), period=d["window"], payload=insights.snapshot_payload(d), created_by=request.user,
                                   expires_at=clock.now() + timedelta(days=7))
    messages.success(request, "Snapshot created. The link works for 7 days and shows these numbers as they are now.")
    return redirect(f"/app/insights/?window={d['window']}&snap={snap.token}")


@staff_required("accounts")
def export_csv(request):
    d = insights.dashboard(request.GET.get("window", "month"))
    resp = HttpResponse(content_type="text/csv")
    resp["Content-Disposition"] = f'attachment; filename="jobs-{d["window"]}.csv"'
    w = csv.writer(resp)
    w.writerow(["Project", "Customer", "kW", "Type", "Installed", "Revenue", "Materials", "Labour", "Warranty/service", "Profit", "Margin %"])
    for r in d["jobs"]:
        w.writerow([r["code"], r["name"], r["kw"], r["type"], r["at"].date() if r["at"] else "", r["revenue"] / 100, r["materials"] / 100,
                    r["labour"] / 100, r["aftersales"] / 100, r["profit"] / 100, f"{r['margin']:.1f}" if r["margin"] is not None else ""])
    return resp
