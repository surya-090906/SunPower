import calendar
import datetime as dt
import re
import secrets
from urllib.parse import quote as urlquote


IMAGE_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".webp"})
DOCUMENT_EXTENSIONS = IMAGE_EXTENSIONS | {".pdf"}


def has_allowed_extension(upload, allowed) -> bool:
    """Uploads are served from our own origin, so judge the file name, never the client-supplied content type."""
    import os
    return os.path.splitext(upload.name or "")[1].lower() in allowed


def normalize_phone(raw: str) -> str:
    """Reduce an Indian phone number to its 10 digits ('' if it does not look like one)."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) > 10:
        digits = digits[-10:]
    return digits if len(digits) == 10 else ""


def add_months(d: dt.date, months: int) -> dt.date:
    """Calendar-month arithmetic (clamps to month end)."""
    y, m = divmod(d.month - 1 + months, 12)
    year, month = d.year + y, m + 1
    return dt.date(year, month, min(d.day, calendar.monthrange(year, month)[1]))


def next_working_day(d: dt.date) -> dt.date:
    """Sundays are not working days."""
    while d.weekday() == 6:
        d += dt.timedelta(days=1)
    return d


def new_token(n: int = 18) -> str:
    return secrets.token_urlsafe(n)


def wa_link(phone: str, text: str) -> str:
    """A wa.me deep link with prefilled text. Works with no WhatsApp Business API."""
    digits = normalize_phone(phone)
    return f"https://wa.me/91{digits}?text={urlquote(text)}" if digits else ""
