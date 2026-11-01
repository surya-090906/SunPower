"""Warranty state of a serial (blueprint section 5.3)."""
from dataclasses import dataclass
from datetime import date

from .. import clock, config


@dataclass
class Warranty:
    state: str            # active | expiring | expired | not_started | void | none
    label: str
    days_left: int | None
    covered: bool
    start: date | None = None
    end: date | None = None

    @property
    def css(self):
        return {"active": "b-green", "expiring": "b-amber", "expired": "b-red", "void": "b-red"}.get(self.state, "b-grey")


def _human_left(days):
    if days >= 60:
        return f"{days // 30} months left"
    if days >= 1:
        return f"{days} day{'s' if days != 1 else ''} left"
    return "ends today"


def warranty_state(serial, on: date | None = None) -> Warranty:
    on = on or clock.today()
    months = serial.warranty_months if serial.warranty_months is not None else serial.product.warranty_months
    if months is None:
        return Warranty("none", "No warranty on this item", None, False)
    if not serial.warranty_end:
        return Warranty("not_started", "Not started: not delivered yet", None, False)
    days_left = (serial.warranty_end - on).days
    base = dict(start=serial.warranty_start, end=serial.warranty_end)
    if serial.exclusion_reason:
        return Warranty("void", f"Void: {serial.exclusion_reason}", days_left, False, **base)
    if days_left < 0:
        gone = -days_left
        ago = f"{gone // 30} months ago" if gone >= 60 else f"{gone} days ago"
        return Warranty("expired", f"Expired {ago}", days_left, False, **base)
    if days_left <= config.get("expiring_days"):
        return Warranty("expiring", f"Expiring soon: {_human_left(days_left)}", days_left, True, **base)
    return Warranty("active", f"Active: {_human_left(days_left)}", days_left, True, **base)
