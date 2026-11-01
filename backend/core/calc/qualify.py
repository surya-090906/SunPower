"""Qualification: is the roof and grid connection suitable? (blueprint section 5.1)"""
from .. import config


def required_area(kw: int) -> int:
    return kw * config.get("sqft_per_kw")


def suggested_kw(bill_paise: int) -> int:
    units = bill_paise / config.get("tariff_paise")
    return min(max(round(units / config.get("units_per_kw_month")), 1), 5)


def max_kw_that_fits(area_sqft: int, load_kw, ongrid: bool) -> int:
    fit = area_sqft // config.get("sqft_per_kw")
    if ongrid and load_kw is not None:
        fit = min(fit, int(load_kw))
    return min(fit, 5)


def feasibility(kind: str, kw: int, area_sqft: int, load_kw, discom: str) -> list[str]:
    """Reasons the project is not feasible as requested. Empty list = pass."""
    reasons = []
    need = required_area(kw)
    if area_sqft < need:
        reasons.append(f"A {kw} kW system needs about {need} sq ft of shadow-free roof; only {area_sqft} sq ft is available.")
    if kind == "ongrid":
        if not discom:
            reasons.append("The electricity board (DISCOM) is not known.")
        if load_kw is not None and float(load_kw) < kw:
            reasons.append(f"Sanctioned load of {load_kw} kW is below the requested {kw} kW.")
    return reasons
