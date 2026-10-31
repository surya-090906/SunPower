"""Stock levels. Serial-tracked items are counted from Serial rows; others from StockMove."""
from decimal import Decimal

from django.db.models import Sum

from ..models import Dispatch, DispatchLine, Product, Serial, StockMove


def on_hand(product) -> Decimal:
    if product.tracked_by_serial:
        return Decimal(Serial.objects.filter(product=product, status=Serial.Status.IN_STOCK).count())
    return StockMove.objects.filter(product=product).aggregate(s=Sum("qty_delta"))["s"] or Decimal(0)


def committed(product, exclude_dispatch=None) -> Decimal:
    """Quantity promised to open pick lists that has not left the warehouse yet."""
    lines = DispatchLine.objects.filter(
        product=product, dispatch__status__in=[Dispatch.Status.TO_PICK, Dispatch.Status.READY])
    if exclude_dispatch is not None:
        lines = lines.exclude(dispatch=exclude_dispatch)
    total = Decimal(0)
    for line in lines:
        # picked serials are already out of 'in_stock'; non-serial items stay until dispatch
        total += line.remaining if product.tracked_by_serial else line.qty_required
    return total


def available(product, exclude_dispatch=None) -> Decimal:
    return on_hand(product) - committed(product, exclude_dispatch)


def stock_table():
    rows = []
    for p in Product.objects.filter(active=True).exclude(category="service"):
        oh, cm = on_hand(p), committed(p)
        rows.append({"product": p, "on_hand": oh, "committed": cm, "available": oh - cm,
                     "value_paise": int(oh * p.avg_cost_paise), "short": oh - cm < 0})
    return rows


def shortages():
    """Products where open orders need more than is on hand, including orders waiting for stock."""
    need = {}
    for line in DispatchLine.objects.filter(dispatch__status=Dispatch.Status.AWAITING_STOCK).select_related("product", "dispatch"):
        need[line.product_id] = need.get(line.product_id, Decimal(0)) + line.qty_required
    out = []
    for pid, qty in need.items():
        product = Product.objects.get(pk=pid)
        gap = qty - max(available(product), Decimal(0))
        if gap > 0:
            out.append({"product": product, "needed": qty, "available": available(product), "to_buy": gap})
    return out
