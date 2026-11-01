"""Runtime configuration. Values live in the Config table (JSON); these are the defaults."""
import json

DEFAULTS = {
    "advance_pct": 30,                 # % of total (incl. GST) that confirms an order
    "first_call_minutes": 30,
    "sqft_per_kw": 100,                # shadow-free roof area needed per kW
    "tariff_paise": 700,               # Rs 7 per unit, used to size a system from the bill
    "units_per_kw_month": 120,
    "panel_wp": 540,
    "lead_time_days": 3,               # order confirmation -> earliest install
    "stock_wait_days": 7,              # extra wait when stock is short
    "quote_valid_days": 15,
    "followup_days": 2,
    "stuck_days": 2,
    "stuck_days_discom": 14,
    "expiring_days": 60,               # warranty "expiring soon" window
    "install_hours_estimate": 8,
    "labour_price_paise_per_hour": 45000,
    "visit_price_paise": 80000,
    "max_discount_pct": 15,
    "min_photos_survey": 2,
    "min_photos_install": 4,
    "subsidy_table": {"1": 3000000, "2": 6000000, "3": 7800000, "4": 7800000, "5": 7800000},
    "company_name": "SunPower Solutions",
    "company_address": "14, Solar Park Road, Whitefield, Bengaluru 560066",
    "company_gstin": "29ABCDE1234F1Z5",
    "company_phone": "080 4000 1234",
    "company_upi": "sunpower.solutions@upi",
    "company_bank": "SunPower Solutions, A/C 5010 0123 4567 89, IFSC SUNB0000123",
}


def get(key):
    from .models import Config
    row = Config.objects.filter(key=key).first()
    if row is not None:
        try:
            return json.loads(row.value)
        except ValueError:
            return row.value
    return DEFAULTS[key]


def set_value(key, value):
    from .models import Config
    Config.objects.update_or_create(key=key, defaults={"value": json.dumps(value)})
