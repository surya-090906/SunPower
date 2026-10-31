"""A controllable clock.

Every timestamp in the app comes from here, never from timezone.now() directly. That lets the
seed script replay real workflows at past dates (so warranties, ledgers and timelines are
produced by the real rules) and lets tests freeze time.
"""
import contextlib
import datetime as dt

from django.utils import timezone

_override = None


def now() -> dt.datetime:
    return _override if _override is not None else timezone.now()


def today() -> dt.date:
    return timezone.localtime(now()).date()


def freeze(moment: dt.datetime) -> None:
    """Pin the clock. Naive datetimes are treated as local (IST) time."""
    global _override
    if timezone.is_naive(moment):
        moment = timezone.make_aware(moment)
    _override = moment


def unfreeze() -> None:
    global _override
    _override = None


def advance(**kwargs) -> dt.datetime:
    """Move a frozen clock forward (days=, hours=, minutes=)."""
    global _override
    base = _override if _override is not None else timezone.now()
    _override = base + dt.timedelta(**kwargs)
    return _override


@contextlib.contextmanager
def at(moment: dt.datetime):
    global _override
    previous = _override
    freeze(moment)
    try:
        yield
    finally:
        _override = previous
