"""Parsing helpers: turn raw POST data into the arguments the workflow rules expect."""
import re

from .money import rupees


def to_int(value, default=None):
    try:
        return int(float(str(value).replace(",", "").strip()))
    except (TypeError, ValueError):
        return default


def to_paise(value):
    """'3,400' or '3400.50' (rupees) -> paise. None for blank/invalid."""
    cleaned = re.sub(r"[^\d.]", "", str(value or ""))
    return rupees(cleaned) if cleaned else None


def to_dt(value):
    """HTML datetime-local string -> aware datetime (local time)."""
    import datetime as dt
    from django.utils import timezone
    if not value:
        return None
    try:
        return timezone.make_aware(dt.datetime.fromisoformat(value))
    except ValueError:
        return None


def enquiry_kwargs(post):
    """The enquiry form (customer portal, public page, staff quick-add) -> submit_enquiry kwargs."""
    kind = post.get("package", "ongrid")
    extra_note = ""
    if kind == "unsure":
        kind, extra_note = "ongrid", "Customer is not sure which package suits them: discuss On-Grid vs Off-Grid."
    declared = {
        "area_sqft": to_int(post.get("area")), "monthly_bill": to_int(post.get("bill")), "load_kw": (post.get("load") or "").strip() or None,
        "discom": (post.get("discom") or "").strip() or None, "roof_type": post.get("roof") or None,
    }
    notes = " ".join(x for x in [(post.get("notes") or "").strip(), extra_note] if x)
    return dict(
        name=post.get("name", ""), phone=post.get("phone", ""), email=(post.get("email") or "").strip(),
        address=post.get("address", ""), city=(post.get("city") or "").strip(), pincode=post.get("pincode", ""), kind=kind,
        segment=post.get("segment", "home"), requested_kw=to_int(post.get("kw"), 3), subsidy_interest=bool(post.get("subsidy")),
        declared={k: v for k, v in declared.items() if v}, preferred_call_time=post.get("call_time", ""), notes=notes,
        password=post.get("password", ""), honeypot=post.get("website", ""))
