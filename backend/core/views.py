"""Views shared by everyone: landing, login, enquiry form, account activation, notifications, demo switch, API."""
import json

from django.conf import settings
from core.api import page

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods

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
    return page(request, "public/landing.html")


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
    return page(request, "public/login.html", {"next": request.POST.get("next") or request.GET.get("next", "")})


def employee_login_view(request):
    if request.user.is_authenticated:
        if request.user.is_customer:
            messages.warning(request, "You are currently signed in with a customer account. Staff accounts only.")
            return redirect("/portal/")
        return redirect(safe_next(request, "/app/"))
    if request.method == "POST":
        user = authenticate(request, username=request.POST.get("username", ""), password=request.POST.get("password", ""))
        if user is None:
            messages.error(request, "That employee username, email or password is not right.")
        elif getattr(user, "is_customer", False):
            messages.error(request, "This sign-in is reserved for SunPower employees. Customers, please log in at the Customer Portal (/login/).")
        else:
            login(request, user)
            destination = safe_next(request, "/app/")
            return redirect(destination if destination.startswith('/app/') else '/app/')
    return page(request, "public/employee_login.html", {
        "next": request.POST.get("next") or request.GET.get("next", ""),
        "employee_portal": True,
    })


@require_http_methods(["GET", "POST"])
def otp_login(request):
    """Customer login via phone OTP. In demo mode, the OTP is shown on screen."""
    if request.user.is_authenticated:
        return redirect(home_for(request.user))
    if not settings.DEMO_MODE:
        messages.error(request, "OTP sign-in is unavailable. Please use your password.")
        return redirect("/login/")

    import secrets
    from datetime import timedelta
    from .utils import normalize_phone

    phone_input = request.POST.get("phone", "") or request.GET.get("phone", "")
    phone_n = normalize_phone(phone_input) if phone_input else ""
    step = request.POST.get("step", "request")
    customer = None

    if request.method == "POST":
        action = request.POST.get("action", "send")
        if action == "send":
            if not phone_n:
                messages.error(request, "Enter a valid 10-digit mobile number.")
                step = "request"
            else:
                customer = Customer.objects.filter(phone=phone_n).first()
                if not customer or not customer.user_id:
                    messages.error(request, "No customer account found for this mobile number. Send an enquiry to get started.")
                    step = "request"
                else:
                    otp = f"{secrets.randbelow(900000) + 100000:06d}"
                    customer.otp_code = otp
                    customer.otp_expires_at = clock.now() + timedelta(minutes=10)
                    customer.save(update_fields=["otp_code", "otp_expires_at"])
                    step = "verify"
                    messages.info(request, f"[DEMO] Your OTP for {phone_n} is: {otp}")
        elif action == "verify":
            otp_entered = request.POST.get("otp", "").strip()
            if not phone_n:
                messages.error(request, "Please enter your mobile number again.")
                step = "request"
            else:
                customer = Customer.objects.filter(phone=phone_n).first()
                if not customer or not customer.user_id:
                    messages.error(request, "Customer account not found.")
                    step = "request"
                elif not customer.otp_code or not customer.otp_expires_at or clock.now() > customer.otp_expires_at:
                    messages.error(request, "The OTP has expired or was not requested. Please request a new one.")
                    step = "request"
                elif customer.otp_code != otp_entered:
                    messages.error(request, "Invalid OTP code. Please check and try again.")
                    step = "verify"
                else:
                    customer.otp_code = ""
                    customer.save(update_fields=["otp_code"])
                    login(request, customer.user, backend="core.auth_backends.PhoneEmailBackend")
                    messages.success(request, f"Welcome back, {customer.name}!")
                    return redirect(safe_next(request, home_for(customer.user)))

    return page(request, "public/otp_login.html", {
        "step": step,
        "phone": phone_n or phone_input,
        "next": request.POST.get("next") or request.GET.get("next", ""),
    })


@require_POST
def logout_view(request):
    logout(request)
    return redirect("/")


@require_POST
def demo_switch(request):
    if not settings.DEMO_MODE:
        raise Http404()
    user = User.objects.filter(pk=request.POST.get("user") or 0, is_active=True, demo_pin=True).first()
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
            initial = {"name": customer.name, "phone": customer.phone, "email": customer.email}
    if request.method == "POST":
        data = request.POST
        kwargs = enquiry_kwargs(data)
        if customer:  # signed-in customers enquire under their own identity
            kwargs.update(name=customer.name, phone=customer.phone, password="")
        try:
            if data.get("package", "ongrid") not in (Project.Kind.ONGRID, Project.Kind.OFFGRID):
                raise RuleError("Choose an On-Grid or Off-Grid system.")
            for key in ("load_kw", "discom"):
                kwargs["declared"].pop(key, None)
            kwargs["preferred_call_time"] = ""
            result = rules.submit_enquiry(
                source="portal", actor=request.user if request.user.is_authenticated else None,
                require_account=customer is None, require_location=True,
                site_lat=data.get("site_lat"), site_lng=data.get("site_lng"), **kwargs)
        except RuleError as e:
            messages.error(request, e.message)
            return page(request, "public/enquire.html", {"form": data, "customer": customer, "base_template": _public_base(request),
                                                           "geocoder_url": settings.GEOCODER_URL})
        if result.user is not None:
            login(request, result.user, backend="django.contrib.auth.backends.ModelBackend")
        if customer or result.user is not None:
            messages.success(request, f"Enquiry {result.project.code} received. We'll call you within 30 minutes.")
            return redirect(f"/portal/p/{result.project.id}/")
        return page(request, "public/enquiry_done.html", {
            "project": result.project, "customer": result.customer, "repeat": result.repeat,
            "claim_token": result.customer.claim_token if result.new_customer else ""})
    return page(request, "public/enquire.html", {"form": initial, "customer": customer, "base_template": _public_base(request),
                                                   "geocoder_url": settings.GEOCODER_URL})


@csrf_exempt
@require_POST
def api_enquiry(request):
    """Inbound webhook for other channels (WhatsApp provider, other web forms, n8n). Header: X-API-Key."""
    key = settings.ENQUIRY_API_KEY
    if not key or request.headers.get("X-API-Key") != key:
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
        return page(request, "public/claim.html", {"invalid": True})
    if request.method == "POST":
        try:
            user = rules.claim_account(token, request.POST.get("password", ""))
        except RuleError as e:
            messages.error(request, e.message)
        else:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            messages.success(request, "Your account is ready.")
            return redirect("/portal/")
    return page(request, "public/claim.html", {"customer": customer})


# ------------------------------------------------------------------ director snapshot (public, expiring)
def share(request, token):
    snap = get_object_or_404(Snapshot, token=token)
    if snap.expires_at < clock.now():
        return page(request, "public/share.html", {"expired": True})
    return page(request, "public/share.html", {"snap": snap, "d": snap.payload})


# ------------------------------------------------------------------ notifications
def _base_for(user):
    return "portal/base.html" if user.is_customer else "backoffice/base.html"


@login_required
def notifications(request):
    items = list(request.user.notifications.all()[:60])
    return page(request, "notifications.html", {"items": items, "base_template": _base_for(request.user)})


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
