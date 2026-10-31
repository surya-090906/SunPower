"""Printable documents: quote, invoice, delivery note, handover certificate, warranty card, receipt.

One access rule for all of them: staff see everything, a customer sees only documents of their own projects
(and never a draft quote). Anything else is a 404, so the existence of other records is not revealed.
"""
from collections import OrderedDict

from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import get_object_or_404, render

from . import clock, config
from .calc.warranty import warranty_state
from .models import Dispatch, Invoice, Payment, Project, Quote, Serial


def _company():
    return {k: config.get(f"company_{k}") for k in ("name", "address", "gstin", "phone", "upi", "bank")}


def _render(request, template, project, **ctx):
    user = request.user
    if not (user.is_backoffice or project.customer.user_id == user.id):
        raise Http404()
    base = "portal/base.html" if user.is_customer else "backoffice/base.html"
    return render(request, f"docs/{template}.html", {"base_template": base, "co": _company(), "p": project,
                                                      "customer": project.customer, **ctx})


@login_required
def quote_doc(request, pk):
    q = get_object_or_404(Quote.objects.select_related("project__customer"), pk=pk)
    if request.user.is_customer and q.status == Quote.Status.DRAFT:
        raise Http404()
    return _render(request, "quote", q.project, q=q, lines=q.lines.all(), discount=q.gross_paise - q.subtotal_paise)


@login_required
def invoice_doc(request, pk):
    inv = get_object_or_404(Invoice.objects.select_related("project__customer", "ticket"), pk=pk)
    if inv.kind == Invoice.Kind.SERVICE:
        pays = inv.payments.filter(status="confirmed")
    else:
        pays = inv.project.payments.filter(status="confirmed").exclude(kind="service")
    return _render(request, "invoice", inv.project, inv=inv, lines=inv.lines.all(), pays=pays,
                   paid=inv.paid_paise, balance=inv.balance_paise)


@login_required
def delivery_doc(request, pk):
    d = get_object_or_404(Dispatch.objects.select_related("project__customer"), pk=pk)
    groups = OrderedDict()
    for line in d.lines.select_related("product"):
        groups[line.product_id] = {"product": line.product, "qty": line.qty_picked or line.qty_required, "serials": []}
    for s in d.serials.select_related("product").order_by("serial_no"):
        groups.setdefault(s.product_id, {"product": s.product, "qty": 0, "serials": []})["serials"].append(s.serial_no)
    return _render(request, "delivery", d.project, d=d, groups=groups.values())


@login_required
def handover_doc(request, pk):
    p = get_object_or_404(Project.objects.select_related("customer"), pk=pk)
    job = getattr(p, "job", None)
    if job is None or job.status != "signed_off":
        raise Http404()
    units = [{"s": s, "w": warranty_state(s)} for s in
             Serial.objects.filter(project=p, status="delivered").select_related("product").order_by("product__category", "serial_no")]
    crew = [a.technician.display_name for a in job.assignments.filter(present=True).select_related("technician")]
    return _render(request, "handover", p, job=job, units=units, crew=crew, photos=job.photos.all())


@login_required
def warranty_doc(request, pk):
    p = get_object_or_404(Project.objects.select_related("customer"), pk=pk)
    units = [{"s": s, "w": warranty_state(s)} for s in
             Serial.objects.filter(project=p, status="delivered").select_related("product").order_by("product__category", "serial_no")]
    if not units:
        raise Http404()
    return _render(request, "warranty", p, units=units, today=clock.today())


@login_required
def receipt_doc(request, pk):
    pay = get_object_or_404(Payment.objects.select_related("project__customer"), pk=pk)
    if pay.status != Payment.Status.CONFIRMED:
        raise Http404()
    return _render(request, "receipt", pay.project, pay=pay)
