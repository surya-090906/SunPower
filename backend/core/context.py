"""Template context available on every page: navigation, unread count, demo user switcher."""
from django.conf import settings

from .models import User

# (label, path, roles that see it). Directors see everything.
STAFF_NAV = [
    ("Home", "/app/", None),
    ("CRM", "/app/crm/", {"sales", "engineer", "accounts", "support"}),
    ("Inventory", "/app/inventory/", {"warehouse", "engineer"}),
    ("Field", "/app/field/", {"technician", "engineer"}),
    ("Helpdesk", "/app/help/", {"support", "technician", "engineer"}),
    ("Accounting", "/app/accounts/", {"accounts"}),
    ("Insights", "/app/insights/", {"accounts"}),
]

PORTAL_NAV = [
    ("Projects", "/portal/"),
    ("My systems", "/portal/systems/"),
    ("Requests", "/portal/requests/"),
    ("Alerts", "/notifications/"),
]


def ui(request):
    ctx = {"APP_NAME": "SunThread", "COMPANY": "SunPower Solutions", "DEMO_MODE": settings.DEMO_MODE}
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated:
        path = request.path
        ctx["unread_count"] = user.notifications.filter(read_at__isnull=True).count()
        if user.is_customer:
            ctx["portal_nav"] = [(label, url, path == url or (url != "/portal/" and path.startswith(url)) or
                                  (url == "/portal/" and path.startswith("/portal/p/"))) for label, url in PORTAL_NAV]
        else:
            items = [(label, url, path == url or (url != "/app/" and path.startswith(url)))
                     for label, url, roles in STAFF_NAV if roles is None or user.role == "director" or user.role in roles]
            if user.role == "director":
                items.append(("Settings", "/app/settings/", path.startswith('/app/settings/')))
            ctx["nav_items"] = items
        if settings.DEMO_MODE:
            ctx["demo_users"] = list(User.objects.filter(demo_pin=True, is_active=True).order_by("role", "first_name"))
    return ctx
