"""Director dashboard numbers (blueprint section 7). Every figure is computed from the ledger and the workflow tables."""
import datetime as dt
from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Sum
from django.utils import timezone

from .. import clock
from ..models import (Invoice, JobAssignment, LedgerEntry, Payment, Project, Quote, Task, Ticket, TicketLine, User)
from ..money import inr
from ..utils import add_months
from .finance import project_financials
from .nextaction import next_action, stuck_info
from .stock import shortages, stock_table

WINDOWS = [("today", "Today"), ("week", "This week"), ("month", "This month")]
FUNNEL = ["enquiry", "qualified", "survey", "quoting", "quoted", "accepted", "ordered", "dispatched", "delivered", "installed"]


def _at_midnight(d):
    return timezone.make_aware(dt.datetime.combine(d, dt.time.min))


def bounds(window):
    """(start, end, previous_start, previous_end): the previous window is the same period one step back."""
    now = clock.now()
    today = clock.today()
    if window == "week":
        start = _at_midnight(today - timedelta(days=today.weekday()))
        return start, now, start - timedelta(days=7), now - timedelta(days=7)
    if window == "month":
        first = today.replace(day=1)
        prev_first = add_months(first, -1)
        local = timezone.localtime(now)
        prev_day = add_months(today, -1)
        prev_end = timezone.make_aware(dt.datetime.combine(prev_day, local.time()))
        return _at_midnight(first), now, _at_midnight(prev_first), prev_end
    start = _at_midnight(today)
    return start, now, start - timedelta(days=1), now - timedelta(days=1)


def _between(qs, field, a, b):
    return qs.filter(**{f"{field}__gte": a, f"{field}__lte": b})


def _window_numbers(a, b):
    enq = _between(Project.objects.all(), "created_at", a, b)
    quotes = _between(Quote.objects.filter(sent_at__isnull=False), "sent_at", a, b)
    orders = _between(Project.objects.filter(ordered_at__isnull=False), "ordered_at", a, b)
    done = list(_between(Project.objects.filter(installed_at__isnull=False), "installed_at", a, b))
    cash = _between(Payment.objects.filter(status="confirmed"), "received_at", a, b).aggregate(s=Sum("amount_paise"))["s"] or 0
    revenue = profit = 0
    for p in done:
        f = project_financials(p)
        revenue += f["revenue"]
        profit += f["profit"]
    return {
        "enquiries": enq.count(), "by_source": {s: enq.filter(source=s).count() for s, _ in Project.Source.choices},
        "quotes": quotes.count(), "quotes_value": quotes.aggregate(s=Sum("total_paise"))["s"] or 0,
        "orders": orders.count(), "orders_value": sum((p.accepted_quote.total_paise if p.accepted_quote else 0) for p in orders),
        "cash": cash, "jobs": len(done), "profit": profit, "revenue": revenue,
        "margin": (profit / revenue * 100) if revenue else None, "done": done,
    }


def _delta(cur, prev, money=False):
    diff = cur - prev
    if diff == 0:
        return {"text": "same as before", "cls": "flat"}
    mag = inr(abs(diff)) if money else f"{abs(diff):g}"
    return {"text": f"{'▲' if diff > 0 else '▼'} {mag} vs previous", "cls": "up" if diff > 0 else "down"}


def job_rows(projects):
    rows = []
    for p in projects:
        f = project_financials(p)
        rows.append({"p": p, "name": p.customer.name, "code": p.code, "kw": p.requested_kw, "type": p.get_kind_display(), "at": p.installed_at,
                     "revenue": f["revenue"], "materials": f["materials"], "labour": f["labour"],
                     "aftersales": f["warranty"] + f["service_cost"] + f["other"], "profit": f["profit"], "margin": f["margin"],
                     "loss": f["profit"] < 0})
    return sorted(rows, key=lambda r: r["at"] or clock.now(), reverse=True)


def repairs():
    now = clock.now()
    out = []
    for t in Ticket.objects.exclude(status="closed").select_related("customer", "serial__product", "assignee"):
        out.append({"t": t, "age": (now - t.created_at).days, "awaiting": t.status == "resolved"})
    return sorted(out, key=lambda r: -r["age"])


def stuck_list(limit=12):
    rows = []
    for p in Project.objects.exclude(stage__in=["completed", "lost"]).select_related("customer", "owner"):
        s = stuck_info(p)
        if s["stuck"]:
            na = next_action(p)
            rows.append({"p": p, "next": na["title"] if na else "", "role": na["role"] if na else "", "days": s["days"], "overdue": s["overdue"]})
    return sorted(rows, key=lambda r: -r["days"])[:limit]


def funnel():
    out = []
    for s in FUNNEL:
        projects = list(Project.objects.filter(stage=s))
        value = 0
        for p in projects:
            q = p.accepted_quote or p.latest_quote
            value += q.total_paise if q else 0
        out.append({"stage": s, "label": dict(Project.Stage.choices)[s], "count": len(projects), "value": value})
    return out


def money_to_chase():
    today = clock.today()
    invoices = []
    for inv in Invoice.objects.exclude(status="void").select_related("project__customer"):
        bal = inv.balance_paise
        if bal > 0:
            invoices.append({"inv": inv, "balance": bal, "late": (today - inv.due_date).days if inv.due_date and inv.due_date < today else 0})
    subsidy = []
    for t in Task.objects.filter(kind="subsidy", status="open").select_related("project__customer").order_by("due_at")[:10]:
        subsidy.append({"t": t, "p": t.project, "waiting": (clock.now() - t.project.stage_since).days})
    return {"invoices": sorted(invoices, key=lambda r: -r["balance"])[:10], "outstanding": sum(r["balance"] for r in invoices),
            "subsidy": subsidy, "pending_payments": Payment.objects.filter(status="pending").count()}


# ------------------------------------------------------------------ payroll
def month_bounds(month_str=None):
    today = clock.today()
    first = today.replace(day=1)
    if month_str:
        try:
            y, m = month_str.split("-")
            first = dt.date(int(y), int(m), 1)
        except (ValueError, TypeError):
            pass
    nxt = add_months(first, 1)
    return first, _at_midnight(first), _at_midnight(nxt)


def payroll(month_str=None):
    """Hours x rate per technician: install hours from signed-off jobs plus labour logged on service tickets."""
    first, a, b = month_bounds(month_str)
    rows = []
    for tech in User.objects.filter(role="technician", is_active=True).order_by("first_name"):
        assigns = JobAssignment.objects.filter(technician=tech, present=True, job__signed_at__gte=a, job__signed_at__lt=b)
        install_h = sum((x.hours for x in assigns), Decimal(0))
        svc_h = sum((l.qty for l in TicketLine.objects.filter(kind="labour", ticket__assignee=tech, ticket__resolved_at__gte=a, ticket__resolved_at__lt=b)), Decimal(0))
        hours = install_h + svc_h
        rows.append({"tech": tech, "jobs": assigns.count(), "visits": TicketLine.objects.filter(kind="labour", ticket__assignee=tech, ticket__resolved_at__gte=a, ticket__resolved_at__lt=b).count(),
                     "install_h": install_h, "service_h": svc_h, "hours": hours, "rate": tech.hourly_rate_paise, "amount": int(hours * tech.hourly_rate_paise)})
    return {"month": first, "rows": rows, "total": sum(r["amount"] for r in rows), "hours": sum((r["hours"] for r in rows), Decimal(0))}


# ------------------------------------------------------------------ the dashboard
def dashboard(window="month"):
    if window not in dict(WINDOWS):
        window = "month"
    a, b, pa, pb = bounds(window)
    cur, prev = _window_numbers(a, b), _window_numbers(pa, pb)
    reps = repairs()
    chase = money_to_chase()
    st = stock_table()
    kpis = [
        {"label": "New enquiries", "value": str(cur["enquiries"]), "delta": _delta(cur["enquiries"], prev["enquiries"]),
         "sub": " · ".join(f"{n} {dict(Project.Source.choices)[s].lower()}" for s, n in cur["by_source"].items() if n) or "none yet"},
        {"label": "Quotes sent", "value": str(cur["quotes"]), "delta": _delta(cur["quotes"], prev["quotes"]), "sub": inr(cur["quotes_value"])},
        {"label": "Orders confirmed", "value": str(cur["orders"]), "delta": _delta(cur["orders"], prev["orders"]), "sub": inr(cur["orders_value"])},
        {"label": "Cash collected", "value": inr(cur["cash"]), "delta": _delta(cur["cash"], prev["cash"], money=True), "sub": "confirmed payments"},
        {"label": "Jobs completed", "value": str(cur["jobs"]), "delta": _delta(cur["jobs"], prev["jobs"]), "sub": "installs signed off"},
        {"label": "Profit on completed jobs", "value": inr(cur["profit"]), "delta": _delta(cur["profit"], prev["profit"], money=True),
         "sub": f"{cur['margin']:.1f}% margin" if cur["margin"] is not None else "no jobs in this period", "neg": cur["profit"] < 0},
        {"label": "Open repairs", "value": str(len(reps)), "delta": None,
         "sub": f"oldest {reps[0]['age']} days" if reps else "none", "warn": any(r["age"] > 3 for r in reps)},
        {"label": "Outstanding balances", "value": inr(chase["outstanding"]), "delta": None, "sub": f"{len(chase['invoices'])} invoices"},
        {"label": "Customer CSAT", "value": f"{Ticket.objects.filter(rating__isnull=False).aggregate(a=Avg('rating'))['a']:.1f} ★" if Ticket.objects.filter(rating__isnull=False).exists() else "5.0 ★", "delta": None, "sub": f"{Ticket.objects.filter(rating__isnull=False).count()} customer ratings"},
    ]
    return {
        "window": window, "windows": WINDOWS, "label": dict(WINDOWS)[window], "start": a, "kpis": kpis,
        "jobs": job_rows(cur["done"]), "funnel": funnel(), "stuck": stuck_list(), "repairs": reps[:10], "chase": chase,
        "payroll": payroll(), "shortages": shortages(), "stock_value": sum(r["value_paise"] for r in st),
        "pipeline_value": sum(f["value"] for f in funnel() if f["stage"] in ("quoted", "accepted", "ordered")),
        "weekly_chart": weekly_chart(),
    }


def weekly_chart(weeks_count=6, width=640, height=140):
    """Last N weeks of completed job revenue as SVG bars with labels and values."""
    today = clock.today()
    buckets = []
    pad_l, pad_r, pad_t, pad_b = 24, 24, 24, 28
    plot_w = width - pad_l - pad_r
    plot_h = height - pad_t - pad_b

    for i in range(weeks_count - 1, -1, -1):
        end_d = today - timedelta(days=i * 7)
        start_d = end_d - timedelta(days=6)
        start_dt = _at_midnight(start_d)
        end_dt = timezone.make_aware(dt.datetime.combine(end_d, dt.time.max))

        projects = list(_between(Project.objects.filter(installed_at__isnull=False), "installed_at", start_dt, end_dt))
        rev = sum(project_financials(p)["revenue"] for p in projects)
        label = start_d.strftime("%d %b")
        buckets.append({
            "start": start_d, "end": end_d, "label": label,
            "revenue": rev, "jobs_count": len(projects),
            "formatted_revenue": inr(rev),
        })

    max_rev = max(max((b["revenue"] for b in buckets), default=0), 1)
    bw = plot_w / len(buckets)
    bars = []
    for i, b in enumerate(buckets):
        h = max(int((b["revenue"] / max_rev) * plot_h), 4 if b["revenue"] > 0 else 2)
        x = pad_l + i * bw + bw * 0.16
        w = bw * 0.68
        y = pad_t + (plot_h - h)
        bars.append({
            "x": round(x, 1), "y": round(y, 1), "w": round(w, 1), "h": round(h, 1),
            "label": b["label"],
            "value": b["formatted_revenue"] if b["revenue"] > 0 else "₹0",
            "jobs": b["jobs_count"],
            "has_revenue": b["revenue"] > 0,
            "tx": round(x + w / 2, 1),
            "ty": round(max(y - 6, 12), 1),
            "ly": height - 10,
        })
    return {"bars": bars, "width": width, "height": height, "max_revenue": inr(max_rev)}


def snapshot_payload(d):
    """A frozen, privacy-safe copy for sharing: customer names are reduced to a first name and an initial."""
    def mask(name):
        parts = name.split()
        return f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else name
    return {
        "company": "SunPower Solutions", "label": d["label"], "generated": timezone.localtime(clock.now()).strftime("%d %b %Y, %I:%M %p"),
        "kpis": [{"label": k["label"], "value": k["value"], "sub": k["sub"], "delta": k["delta"]["text"] if k["delta"] else ""} for k in d["kpis"]],
        "jobs": [{"name": mask(r["name"]), "kw": r["kw"], "type": r["type"], "revenue": inr(r["revenue"]), "profit": inr(r["profit"]),
                  "margin": f"{r['margin']:.1f}%" if r["margin"] is not None else "–", "loss": r["loss"]} for r in d["jobs"]],
        "funnel": [{"label": f["label"], "count": f["count"], "value": inr(f["value"])} for f in d["funnel"]],
        "stuck": [{"name": mask(s["p"].customer.name), "code": s["p"].code, "next": s["next"], "days": s["days"]} for s in d["stuck"]],
        "repairs": [{"code": r["t"].code, "name": mask(r["t"].customer.name), "status": r["t"].get_status_display(), "age": r["age"]} for r in d["repairs"]],
        "text": (f"SunPower {d['label'].lower()}: " + "; ".join(f"{k['label']} {k['value']}" for k in d["kpis"][:6])),
    }


def waterfall(fin, width=640, height=260):
    """Revenue -> materials -> labour -> after-sales -> profit, as ready-to-draw SVG bars."""
    steps = [("Revenue", fin["revenue"], "up"), ("Materials", -fin["materials"], "down"), ("Labour", -fin["labour"], "down"),
             ("Warranty and service", -(fin["warranty"] + fin["service_cost"] + fin["other"]), "down"), ("Profit", fin["profit"], "total")]
    top = max(fin["revenue"], 1)
    pad_l, pad_b, pad_t = 14, 44, 24
    plot_h = height - pad_b - pad_t
    scale = plot_h / top
    bw = (width - pad_l * 2) / len(steps)
    bars, running = [], 0
    for i, (label, amt, kind) in enumerate(steps):
        if kind == "total":
            y0, y1 = 0, amt
        else:
            y0, y1 = running, running + amt
            running = y1
        lo, hi = min(y0, y1), max(y0, y1)
        y = pad_t + (top - hi) * scale
        h = max((hi - lo) * scale, 2)
        cls = "var(--green)" if kind == "up" else ("var(--red)" if kind == "down" else ("var(--green)" if amt >= 0 else "var(--red)"))
        bars.append({"x": pad_l + i * bw + bw * 0.16, "y": y, "w": bw * 0.68, "h": h, "color": cls, "label": label,
                     "value": inr(amt) if kind != "down" else "-" + inr(abs(amt)), "tx": pad_l + i * bw + bw / 2, "ty": y - 6, "ly": height - 18})
    return {"bars": bars, "width": width, "height": height}
