"""Per-project profit from the ledger (blueprint section 5.4)."""
from .. import clock, config
from ..models import LedgerEntry, Project, User


def _sum(entries, kind, *categories):
    return sum(e.amount_paise for e in entries if e.kind == kind and (not categories or e.category in categories))


def crew_size(kw: int) -> int:
    return 2 if kw <= 3 else 3


def estimate(project):
    """Estimated (revenue, materials, labour) for a job that has not been installed yet."""
    quote = project.accepted_quote or project.latest_quote
    if not quote:
        return 0, 0, 0
    materials = 0
    for line in quote.lines.select_related("product"):
        if line.product and not line.product.is_service:
            materials += int(line.qty * (line.product.avg_cost_paise or line.product.cost_paise))
    rates = list(User.objects.filter(role="technician", hourly_rate_paise__gt=0).values_list("hourly_rate_paise", flat=True))
    rate = sum(rates) // len(rates) if rates else 25000
    labour = crew_size(quote.kw) * config.get("install_hours_estimate") * rate
    return quote.subtotal_paise, materials, labour


def project_financials(project) -> dict:
    entries = list(project.ledger.all())
    revenue = _sum(entries, "revenue")
    materials = _sum(entries, "cost", "material")
    labour = _sum(entries, "cost", "labour")
    warranty = _sum(entries, "cost", "warranty_material", "warranty_labour")
    service_cost = _sum(entries, "cost", "service_material", "service_labour")
    other = _sum(entries, "cost", "other")
    estimated = project.stage not in (Project.Stage.INSTALLED, Project.Stage.COMPLETED)
    if estimated:
        revenue, materials, labour = estimate(project)
        warranty = service_cost = other = 0
    cost = materials + labour + warranty + service_cost + other
    profit = revenue - cost
    return {
        "revenue": revenue, "materials": materials, "labour": labour, "warranty": warranty,
        "service_cost": service_cost, "other": other, "cost": cost, "profit": profit,
        "margin": (profit / revenue * 100) if revenue else None, "estimated": estimated,
    }


def quote_margin(quote) -> dict:
    """Estimated margin of a quote against standard cost (shown as a chip on the quote builder)."""
    materials = 0
    for line in quote.lines.select_related("product"):
        if line.product and not line.product.is_service:
            materials += int(line.qty * (line.product.avg_cost_paise or line.product.cost_paise))
    rates = list(User.objects.filter(role="technician", hourly_rate_paise__gt=0).values_list("hourly_rate_paise", flat=True))
    rate = sum(rates) // len(rates) if rates else 25000
    labour = crew_size(quote.kw) * config.get("install_hours_estimate") * rate
    revenue = quote.subtotal_paise
    profit = revenue - materials - labour
    return {"revenue": revenue, "cost": materials + labour, "profit": profit, "margin": (profit / revenue * 100) if revenue else None}
