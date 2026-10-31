"""Template filters, loaded as builtins (no {% load %} needed)."""
from decimal import Decimal

from django import template
from django.utils import timezone

from .. import clock
from ..money import inr as _inr

register = template.Library()


@register.filter
def inr(paise):
    return _inr(paise)


@register.filter
def inr2(paise):
    return _inr(paise, with_paise=True)


@register.filter
def qty(value):
    """6.00 -> 6, 1.50 -> 1.5"""
    if value in (None, ""):
        return ""
    d = Decimal(value)
    return f"{d:f}".rstrip("0").rstrip(".") if "." in f"{d:f}" else f"{d:f}"


@register.filter
def dmy(value):
    if not value:
        return "–"
    if hasattr(value, "hour"):
        value = timezone.localtime(value).date()
    return value.strftime("%d %b %Y")


@register.filter
def dtm(value):
    if not value:
        return "–"
    return timezone.localtime(value).strftime("%d %b %Y, %I:%M %p").replace(" 0", " ")


@register.filter
def hm(value):
    if not value:
        return "–"
    return timezone.localtime(value).strftime("%I:%M %p").lstrip("0")


@register.filter
def ago(value):
    if not value:
        return "–"
    secs = int((clock.now() - value).total_seconds())
    if secs < 90:
        return "just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600} h ago"
    days = secs // 86400
    if days < 45:
        return f"{days} d ago"
    return f"{days // 30} mo ago"


@register.filter
def pct(value, digits=1):
    if value is None:
        return "–"
    return f"{value:.{digits}f}%"


@register.filter
def phone(value):
    value = value or ""
    return f"+91 {value[:5]} {value[5:]}" if len(value) == 10 else value


@register.filter
def get_item(mapping, key):
    try:
        return mapping.get(key)
    except AttributeError:
        return None


@register.filter
def stage_class(stage):
    return {
        "enquiry": "b-grey", "qualified": "b-blue", "survey": "b-blue", "quoting": "b-amber", "quoted": "b-amber",
        "accepted": "b-amber", "ordered": "b-violet", "dispatched": "b-violet", "delivered": "b-violet",
        "installed": "b-green", "completed": "b-green", "lost": "b-red",
    }.get(stage, "b-grey")


@register.filter
def status_class(status):
    return {
        "confirmed": "b-green", "paid": "b-green", "done": "b-green", "approved": "b-green", "closed": "b-green",
        "delivered": "b-green", "signed_off": "b-green", "active": "b-green", "accepted": "b-green",
        "pending": "b-amber", "sent": "b-amber", "draft": "b-grey", "requested": "b-blue", "assigned": "b-blue",
        "scheduled": "b-blue", "to_pick": "b-blue", "ready": "b-violet", "dispatched": "b-violet",
        "resolved": "b-violet", "new": "b-amber", "reopened": "b-red", "rejected": "b-red", "expired": "b-red",
        "awaiting_stock": "b-red", "expiring": "b-amber", "void": "b-red", "open": "b-amber", "blocked": "b-grey",
        "na": "b-grey", "in_stock": "b-green", "reserved": "b-blue", "replaced": "b-red", "superseded": "b-grey",
        "not_started": "b-grey", "none": "b-grey",
    }.get(status, "b-grey")
