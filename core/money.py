"""Money is stored as integer paise. These helpers convert and format (en-IN grouping)."""
from decimal import ROUND_HALF_UP, Decimal


def rupees(r) -> int:
    """Rupees (int/float/str/Decimal) -> paise."""
    return int((Decimal(str(r)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def pct_of(paise: int, pct) -> int:
    return int((Decimal(paise) * Decimal(str(pct)) / 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _group_indian(n: int) -> str:
    s = str(n)
    if len(s) <= 3:
        return s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return ",".join(parts) + "," + tail


def inr(paise, with_paise: bool = False) -> str:
    """Format paise as ₹1,50,000 (negative as -₹1,000). Whole rupees unless with_paise=True."""
    if paise is None or paise == "":
        return "–"
    paise = int(paise)
    sign = "-" if paise < 0 else ""
    paise = abs(paise)
    if with_paise:
        whole, frac = divmod(paise, 100)
        return f"{sign}₹{_group_indian(whole)}.{frac:02d}"
    whole = (paise + 50) // 100
    return f"{sign}₹{_group_indian(whole)}" if whole else "₹0"
