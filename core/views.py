"""Views shared by everyone: landing, login, enquiry form, account activation, notifications, demo switch, API."""
import json

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from . import clock, rules
from .forms import enquiry_kwargs
from .models import Customer, Notification, Project, Snapshot, User
from .rules import RuleError


def home_for(user):
    return "/portal/" if user.is_customer else "/app/"


def safe_next(request, default):
    nxt = request.POST.get("next") or request.GET.get("next") or ""
    return nxt if nxt.startswith("/") and not nxt.startswith("//") else default


def landing(request):
    if request.user.is_authenticated:
        return redirect(home_for(request.user))
    return render(request, "public/landing.html")


def login_view(request):
    if request.user.is_authenticated:
        return redirect(home_for(request.user))
    if request.method == "POST":
        user = authenticate(request, username=request.POST.get("username", ""), password=request.POST.get("password", ""))
        if user is None:
            messages.error(request, "That phone, email or password is not right.")
        else:
            login(request, user)
            return redirect(safe_next(request, home_for(user)))
    return render(request, "public/login.html", {"next": request.GET.get("next", "")})


@require_POST
def logout_view(request):
    logout(request)
    return redirect("/")


@require_POST
def demo_switch(request):
    if not settings.DEMO_MODE:
        raise Http404()
    user = User.objects.filter(pk=request.POST.get("user") or 0, is_active=True).first()
    if user is not None:
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return redirect(home_for(user))
    return redirect(request.META.get("HTTP_REFERER") or "/")


# ------------------------------------------------------------------ T1: the customer's own enquiry
def _public_base(request):
    return "portal/base.html" if request.user.is_authenticated and request.user.is_customer else "public/base.html"


def enquire(request):
    initial = {}
    customer = None
    if request.user.is_authenticated and request.user.is_customer:
        customer = getattr(request.user, "customer_profile", None)
        if customer:
            initial = {"name": customer.name, "phone": customer.phone, "email": customer.email, "address": customer.address,
                       "city": customer.city, "pincode": customer.pincode}
    if request.method == "POST":
        data = request.POST
        kwargs = enquiry_kwargs(data)
        if customer:  # signed-in customers enquire under their own identity
            kwargs.update(name=customer.name, phone=customer.phone, password="")
        try:
            result = rules.submit_enquiry(source="portal", actor=request.user if request.user.is_authenticated else None, **kwargs)
        except RuleError as e:
            messages.error(request, e.message)
            return render(request, "public/enquire.html", {"form": data, "customer": customer, "base_template": _public_base(request)})
        if result.user is not None:
            login(request, result.user, backend="django.contrib.auth.backends.ModelBackend")
        if customer or result.user is not None:
            messages.success(request, f"Enquiry {result.project.code} received. We'll call you within 30 minutes.")
            return redirect(f"/portal/p/{result.project.id}/")
        return render(request, "public/enquiry_done.html", {
            "project": result.project, "customer": result.customer, "repeat": result.repeat,
            "claim_token": result.customer.claim_token if result.new_customer else ""})
    return render(request, "public/enquire.html", {"form": initial, "customer": customer, "base_template": _public_base(request)})


@csrf_exempt
@require_POST
def api_enquiry(request):
    """Inbound webhook for other channels (WhatsApp provider, other web forms, n8n). Header: X-API-Key."""
    key = getattr(settings, "ENQUIRY_API_KEY", "demo-key")
    if request.headers.get("X-API-Key") != key:
        return JsonResponse({"ok": False, "error": "Invalid API key."}, status=401)
    try:
        body = json.loads(request.body or b"{}")
    except ValueError:
        return JsonResponse({"ok": False, "error": "Send JSON."}, status=400)
    post = {k: ("" if v is None else str(v)) for k, v in body.items()}
    post.setdefault("package", "ongrid")
    kwargs = enquiry_kwargs(post)
    kwargs["password"] = ""
    try:
        result = rules.submit_enquiry(source=body.get("source") if body.get("source") in ("call", "whatsapp") else "webhook", **kwargs)
    except RuleError as e:
        return JsonResponse({"ok": False, "error": e.message}, status=400)
    return JsonResponse({"ok": True, "reference": result.project.code, "repeat": result.repeat})


# ------------------------------------------------------------------ activation link
def claim(request, token):
    customer = Customer.objects.filter(claim_token=token, user__isnull=True).first()
    if customer is None:
        return render(request, "public/claim.html", {"invalid": True})
    if request.method == "POST":
        try:
            user = rules.claim_account(token, request.POST.get("password", ""))
        except RuleError as e:
            messages.error(request, e.message)
        else:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            messages.success(request, "Your account is ready.")
            return redirect("/portal/")
    return render(request, "public/claim.html", {"customer": customer})


# ------------------------------------------------------------------ director snapshot (public, expiring)
def share(request, token):
    snap = get_object_or_404(Snapshot, token=token)
    if snap.expires_at < clock.now():
        return render(request, "public/share.html", {"expired": True})
    return render(request, "public/share.html", {"snap": snap, "d": snap.payload})


# ------------------------------------------------------------------ notifications
def _base_for(user):
    return "portal/base.html" if user.is_customer else "backoffice/base.html"


@login_required
def notifications(request):
    items = list(request.user.notifications.all()[:60])
    return render(request, "notifications.html", {"items": items, "base_template": _base_for(request.user)})


@login_required
def notification_go(request, pk):
    n = get_object_or_404(Notification, pk=pk, to_user=request.user)
    if n.read_at is None:
        n.read_at = clock.now()
        n.save(update_fields=["read_at"])
    return redirect(n.link or "/notifications/")


@login_required
@require_POST
def notifications_read_all(request):
    request.user.notifications.filter(read_at__isnull=True).update(read_at=clock.now())
    return redirect("/notifications/")


@login_required
def notifications_count(request):
    return JsonResponse({"count": request.user.notifications.filter(read_at__isnull=True).count()})
