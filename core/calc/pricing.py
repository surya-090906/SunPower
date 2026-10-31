"""Kit template -> quote lines, totals, completeness check (blueprint section 5.2)."""
import math
from decimal import ROUND_HALF_UP, Decimal

from .. import config
from ..models import Category, KitLine, KitTemplate, QuoteLine
from ..money import pct_of


def panel_count(kw: int) -> int:
    return math.ceil(kw * 1000 / config.get("panel_wp"))


def default_template(kind: str, kw: int):
    return KitTemplate.objects.filter(kind=kind, kw=kw, active=True).first()


def _qty(rule, base, kw, panels, survey) -> Decimal:
    base = Decimal(base)
    if rule == KitLine.Rule.FIXED:
        return base
    if rule in (KitLine.Rule.PER_PANEL, KitLine.Rule.BY_ROOF):
        return base * panels
    if rule == KitLine.Rule.PER_KW:
        return base * kw
    if rule == KitLine.Rule.CABLE_RUN:
        run = survey.cable_run_m if survey is not None and survey.cable_run_m else 20
        return Decimal(math.ceil(run * 1.1))
    if rule == KitLine.Rule.BATTERY:
        return base * math.ceil(kw / 2)
    return base


def build_lines(quote, template, survey):
    """(Re)generate the auto lines of a draft quote from its template and the approved survey."""
    quote.lines.all().delete()
    panels = panel_count(quote.kw)
    quote.panel_count = panels
    for i, kl in enumerate(template.lines.select_related("product", "alt_product")):
        product = kl.product
        if kl.rule == KitLine.Rule.BY_ROOF and survey is not None and survey.roof_type == "tin" and kl.alt_product:
            product = kl.alt_product
        QuoteLine.objects.create(
            quote=quote, product=product, description=product.name, category=product.category,
            qty=_qty(kl.rule, kl.qty, quote.kw, panels, survey), unit_price_paise=product.price_paise,
            tax_pct=product.tax_pct, is_auto=True, sort=i)


def subsidy_for(project, kw: int) -> int:
    if not project.wants_subsidy:
        return 0
    return int(config.get("subsidy_table").get(str(min(max(kw, 1), 5)), 0))


def recalc(quote):
    """Apply the discount pro-rata to every line, then total up (ex-GST subtotal, GST, total)."""
    disc = Decimal(quote.discount_pct)
    gross = net_total = tax_total = 0
    for line in quote.lines.all():
        g = line.gross_paise
        net = int((Decimal(g) * (Decimal(100) - disc) / 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        tax = pct_of(net, line.tax_pct)
        QuoteLine.objects.filter(pk=line.pk).update(net_paise=net, tax_paise=tax)
        gross += g
        net_total += net
        tax_total += tax
    quote.gross_paise = gross
    quote.subtotal_paise = net_total
    quote.tax_paise = tax_total
    quote.total_paise = net_total + tax_total
    quote.subsidy_paise = subsidy_for(quote.project, quote.kw)
    quote.save()
    return quote


def missing_categories(quote) -> list[str]:
    """Human labels of required part categories that have no line on the quote."""
    if not quote.template_id:
        return []
    required = set(quote.template.lines.exclude(required_category="").values_list("required_category", flat=True))
    present = set(quote.lines.values_list("category", flat=True))
    labels = dict(Category.choices)
    return [labels.get(c, c) for c in sorted(required - present)]
