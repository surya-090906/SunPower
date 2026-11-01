"""Data model. Money is integer paise. All timestamps default to core.clock.now."""
from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models

from . import clock


# --------------------------------------------------------------------------- users
class Role(models.TextChoices):
    CUSTOMER = "customer", "Customer"
    SALES = "sales", "Sales"
    ENGINEER = "engineer", "Engineer"
    WAREHOUSE = "warehouse", "Warehouse"
    TECHNICIAN = "technician", "Technician"
    SUPPORT = "support", "Support"
    ACCOUNTS = "accounts", "Accounts"
    DIRECTOR = "director", "Director"


class User(AbstractUser):
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=10, blank=True, db_index=True)
    hourly_rate_paise = models.PositiveIntegerField(default=0)
    can_survey = models.BooleanField(default=False)
    demo_pin = models.BooleanField(default=False, help_text="Listed in the demo user switcher")

    @property
    def display_name(self):
        return self.get_full_name() or self.username

    @property
    def is_customer(self):
        return self.role == Role.CUSTOMER

    @property
    def is_backoffice(self):
        return self.role != Role.CUSTOMER

    def __str__(self):
        return f"{self.display_name} ({self.role})"


class Customer(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=10, unique=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=60, blank=True)
    pincode = models.CharField(max_length=6, blank=True)
    consumer_no = models.CharField(max_length=30, blank=True)
    discom = models.CharField(max_length=60, blank=True)
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="customer_profile")
    claim_token = models.CharField(max_length=40, blank=True, db_index=True)
    otp_code = models.CharField(max_length=6, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    invited_at = models.DateTimeField(null=True, blank=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.phone})"


# --------------------------------------------------------------------------- catalogue
class Category(models.TextChoices):
    PANEL = "panel", "Solar panel"
    INVERTER = "inverter", "Inverter"
    BATTERY = "battery", "Battery"
    CONTROLLER = "charge_controller", "Charge controller"
    STRUCTURE = "structure", "Mounting structure"
    WIRING_BOX = "wiring_box", "Wiring box"
    PROTECTION = "protection", "Protection / switchgear"
    EARTHING = "earthing", "Earthing kit"
    CABLE = "cable", "Cable"
    CONNECTOR = "connector", "Connector"
    SERVICE = "service", "Service"


class Product(models.Model):
    sku = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=20, choices=Category.choices)
    tracked_by_serial = models.BooleanField(default=False)
    warranty_months = models.PositiveIntegerField(null=True, blank=True)
    cost_paise = models.PositiveBigIntegerField(default=0, help_text="Standard cost")
    avg_cost_paise = models.PositiveBigIntegerField(default=0, help_text="Weighted average of receipts")
    price_paise = models.PositiveBigIntegerField(default=0)
    tax_pct = models.PositiveSmallIntegerField(default=5)
    unit = models.CharField(max_length=10, default="nos")
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "sku"]

    @property
    def is_service(self):
        return self.category == Category.SERVICE

    def __str__(self):
        return f"{self.sku} {self.name}"


class KitTemplate(models.Model):
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=10)  # Project.Kind value
    kw = models.PositiveSmallIntegerField()
    requires_survey = models.BooleanField(default=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["kind", "kw"]
        unique_together = [("kind", "kw")]

    def __str__(self):
        return self.name


class KitLine(models.Model):
    class Rule(models.TextChoices):
        FIXED = "FIXED", "Fixed quantity"
        PER_PANEL = "PER_PANEL", "Per panel"
        PER_KW = "PER_KW", "Per kW"
        CABLE_RUN = "CABLE_RUN", "Cable run from survey (+10%)"
        BY_ROOF = "BY_ROOF", "Per panel, variant by roof type"
        BATTERY = "BATTERY", "Battery units (kW / 2, rounded up)"

    template = models.ForeignKey(KitTemplate, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="+")
    alt_product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.PROTECT, related_name="+",
                                    help_text="Used instead when the roof is tin (BY_ROOF)")
    rule = models.CharField(max_length=12, choices=Rule.choices, default=Rule.FIXED)
    qty = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    required_category = models.CharField(max_length=20, blank=True, help_text="Category that must be present before a quote is sent")
    sort = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort", "id"]


# --------------------------------------------------------------------------- project (the spine)
class Project(models.Model):
    class Kind(models.TextChoices):
        ONGRID = "ongrid", "On-Grid"
        OFFGRID = "offgrid", "Off-Grid"
        PANELSET = "panelset", "Panel Set (hardware)"

    class Segment(models.TextChoices):
        HOME = "home", "Home"
        COMMERCIAL = "commercial", "Commercial"
        INDUSTRY = "industry", "Industry"
        FACTORY = "factory", "Small factory"

    class Stage(models.TextChoices):
        ENQUIRY = "enquiry", "Enquiry"
        QUALIFIED = "qualified", "Qualified"
        SURVEY = "survey", "Survey review"
        QUOTING = "quoting", "Quoting"
        QUOTED = "quoted", "Quoted"
        ACCEPTED = "accepted", "Accepted"
        ORDERED = "ordered", "Ordered"
        DISPATCHED = "dispatched", "Dispatched"
        DELIVERED = "delivered", "Delivered"
        INSTALLED = "installed", "Installed"
        COMPLETED = "completed", "Completed"
        LOST = "lost", "Lost"

    class Source(models.TextChoices):
        PORTAL = "portal", "Web form"
        CALL = "call", "Phone call"
        WHATSAPP = "whatsapp", "WhatsApp"
        WEBHOOK = "webhook", "Integration"

    code = models.CharField(max_length=20, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="projects")
    submitted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.ONGRID)
    segment = models.CharField(max_length=10, choices=Segment.choices, default=Segment.HOME)
    requested_kw = models.PositiveSmallIntegerField(default=3)
    subsidy_interest = models.BooleanField(default=False)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.PORTAL)
    stage = models.CharField(max_length=12, choices=Stage.choices, default=Stage.ENQUIRY, db_index=True)
    stage_since = models.DateTimeField(default=clock.now)
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="owned_projects")
    lost_reason = models.CharField(max_length=200, blank=True)
    site_address = models.TextField(blank=True)
    site_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    site_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    preferred_call_time = models.CharField(max_length=40, blank=True)
    notes = models.TextField(blank=True)
    declared = models.JSONField(default=dict, blank=True)  # what the customer told us
    # what Sales verified on the call
    verified_area_sqft = models.PositiveIntegerField(null=True, blank=True)
    verified_bill_paise = models.PositiveBigIntegerField(null=True, blank=True)
    verified_phase = models.CharField(max_length=10, blank=True)
    verified_load_kw = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    verified_discom = models.CharField(max_length=60, blank=True)
    qualification_notes = models.TextField(blank=True)
    qualified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    qualified_at = models.DateTimeField(null=True, blank=True)
    contract_value_paise = models.PositiveBigIntegerField(default=0, help_text="Accepted quote subtotal, ex-GST")
    advance_required_paise = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(default=clock.now)
    ordered_at = models.DateTimeField(null=True, blank=True)
    installed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            from django.utils import timezone
            yymm = timezone.localtime(self.created_at).strftime("%y%m")
            self.code = f"SP-{yymm}-{self.pk:04d}"
            type(self).objects.filter(pk=self.pk).update(code=self.code)

    @property
    def subsidy_eligible(self):
        return self.kind == self.Kind.ONGRID and self.segment == self.Segment.HOME

    @property
    def wants_subsidy(self):
        return self.subsidy_eligible and self.subsidy_interest

    @property
    def title(self):
        return f"{self.requested_kw} kW {self.get_kind_display()}"

    @property
    def maps_url(self):
        from urllib.parse import quote
        location = f"{self.site_lat},{self.site_lng}" if self.site_lat is not None and self.site_lng is not None else self.site_address
        return f"https://www.google.com/maps/search/?api=1&query={quote(location or '')}"

    @property
    def survey(self):
        return self.surveys.exclude(status=Survey.Status.REJECTED).order_by("-id").first()

    @property
    def accepted_quote(self):
        return self.quotes.filter(status=Quote.Status.ACCEPTED).order_by("-version").first()

    @property
    def latest_quote(self):
        return self.quotes.exclude(status=Quote.Status.SUPERSEDED).order_by("-version").first()

    @property
    def confirmed_paid_paise(self):
        return self.payments.filter(status=Payment.Status.CONFIRMED).exclude(kind=Payment.Kind.SERVICE).aggregate(
            s=models.Sum("amount_paise"))["s"] or 0

    @property
    def total_due_paise(self):
        q = self.accepted_quote
        return q.total_paise if q else 0

    @property
    def balance_due_paise(self):
        return max(self.total_due_paise - self.confirmed_paid_paise, 0)

    def __str__(self):
        return f"{self.code} {self.customer.name}"


class Survey(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        DONE = "done", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    DIRECTIONS = [(d, d) for d in ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="surveys")
    assignee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="surveys")
    scheduled_for = models.DateField(null=True, blank=True)
    customer_confirmed_at = models.DateTimeField(null=True, blank=True)
    reschedule_request = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.REQUESTED)
    roof_direction = models.CharField(max_length=2, choices=DIRECTIONS, blank=True)
    tilt_deg = models.PositiveSmallIntegerField(null=True, blank=True)
    roof_type = models.CharField(max_length=3, choices=[("rcc", "RCC"), ("tin", "Tin shed")], blank=True)
    usable_area_sqft = models.PositiveIntegerField(null=True, blank=True)
    cable_run_m = models.PositiveSmallIntegerField(null=True, blank=True)
    shading = models.CharField(max_length=8, choices=[("none", "None"), ("partial", "Partial"), ("heavy", "Heavy")], blank=True)
    notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-id"]


class Photo(models.Model):
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.CASCADE, related_name="photos")
    survey = models.ForeignKey(Survey, null=True, blank=True, on_delete=models.CASCADE, related_name="photos")
    job = models.ForeignKey("InstallJob", null=True, blank=True, on_delete=models.CASCADE, related_name="photos")
    ticket = models.ForeignKey("Ticket", null=True, blank=True, on_delete=models.CASCADE, related_name="photos")
    kind = models.CharField(max_length=20, blank=True)
    file = models.FileField(upload_to="photos/%Y/%m/")
    caption = models.CharField(max_length=120, blank=True)
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["id"]


# --------------------------------------------------------------------------- quotes, payments, invoices
class Quote(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        SUPERSEDED = "superseded", "Superseded"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="quotes")
    version = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    template = models.ForeignKey(KitTemplate, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    kw = models.PositiveSmallIntegerField(default=3)
    panel_count = models.PositiveSmallIntegerField(default=0)
    discount_pct = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    gross_paise = models.BigIntegerField(default=0)
    subtotal_paise = models.BigIntegerField(default=0, help_text="After discount, ex-GST")
    tax_paise = models.BigIntegerField(default=0)
    total_paise = models.BigIntegerField(default=0)
    subsidy_paise = models.BigIntegerField(default=0, help_text="Information only; paid by government to the customer")
    valid_until = models.DateField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by_name = models.CharField(max_length=120, blank=True)
    override_reason = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-version"]

    @property
    def net_cost_after_subsidy_paise(self):
        return self.total_paise - self.subsidy_paise


class QuoteLine(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.PROTECT, related_name="+")
    description = models.CharField(max_length=200)
    category = models.CharField(max_length=20, blank=True)
    qty = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price_paise = models.BigIntegerField(default=0)
    tax_pct = models.PositiveSmallIntegerField(default=5)
    net_paise = models.BigIntegerField(default=0, help_text="After discount, ex-GST")
    tax_paise = models.BigIntegerField(default=0)
    is_auto = models.BooleanField(default=True)
    sort = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort", "id"]

    @property
    def gross_paise(self):
        return int((self.qty * self.unit_price_paise).quantize(Decimal("1")))


class Payment(models.Model):
    class Kind(models.TextChoices):
        ADVANCE = "advance", "Advance"
        BALANCE = "balance", "Balance"
        FULL = "full", "Full payment"
        SERVICE = "service", "Service invoice"

    class Method(models.TextChoices):
        UPI = "upi", "UPI"
        BANK = "bank", "Bank transfer"
        CASH = "cash", "Cash"
        CHEQUE = "cheque", "Cheque"
        ONLINE_DEMO = "online_demo", "Online (demo checkout)"

    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        PENDING = "pending", "Pending verification"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="payments")
    invoice = models.ForeignKey("Invoice", null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.ADVANCE)
    amount_paise = models.PositiveBigIntegerField()
    method = models.CharField(max_length=12, choices=Method.choices, default=Method.UPI)
    reference = models.CharField(max_length=60, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CONFIRMED)
    submitted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    verified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    received_at = models.DateTimeField(default=clock.now)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-received_at", "-id"]


class Invoice(models.Model):
    class Kind(models.TextChoices):
        FINAL = "final", "Tax invoice"
        SERVICE = "service", "Service invoice"

    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        PAID = "paid", "Paid"
        VOID = "void", "Void"

    number = models.CharField(max_length=20, unique=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="invoices")
    ticket = models.ForeignKey("Ticket", null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices")
    kind = models.CharField(max_length=8, choices=Kind.choices, default=Kind.FINAL)
    status = models.CharField(max_length=6, choices=Status.choices, default=Status.SENT)
    subtotal_paise = models.BigIntegerField(default=0)
    tax_paise = models.BigIntegerField(default=0)
    total_paise = models.BigIntegerField(default=0)
    issue_date = models.DateField(default=clock.today)
    due_date = models.DateField(null=True, blank=True)
    sent_to_customer = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.number:
            self.number = f"INV-{self.issue_date:%y}-{self.pk:04d}"
            type(self).objects.filter(pk=self.pk).update(number=self.number)

    @property
    def paid_paise(self):
        if self.kind == self.Kind.SERVICE:
            return self.payments.filter(status=Payment.Status.CONFIRMED).aggregate(s=models.Sum("amount_paise"))["s"] or 0
        return self.project.confirmed_paid_paise

    @property
    def balance_paise(self):
        return max(self.total_paise - self.paid_paise, 0)


class InvoiceLine(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="lines")
    description = models.CharField(max_length=200)
    qty = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price_paise = models.BigIntegerField(default=0)
    tax_pct = models.PositiveSmallIntegerField(default=5)
    net_paise = models.BigIntegerField(default=0)
    tax_paise = models.BigIntegerField(default=0)

    class Meta:
        ordering = ["id"]


# --------------------------------------------------------------------------- stock
class Supplier(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class PurchaseReceipt(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="receipts")
    ref = models.CharField(max_length=60, blank=True)
    received_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    received_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-received_at", "-id"]


class PurchaseLine(models.Model):
    receipt = models.ForeignKey(PurchaseReceipt, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="purchase_lines")
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost_paise = models.PositiveBigIntegerField()


class Dispatch(models.Model):
    class Status(models.TextChoices):
        AWAITING_STOCK = "awaiting_stock", "Awaiting stock"
        TO_PICK = "to_pick", "To pick"
        READY = "ready", "Ready to dispatch"
        DISPATCHED = "dispatched", "Dispatched"
        DELIVERED = "delivered", "Delivered"

    code = models.CharField(max_length=12, unique=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="dispatches")
    status = models.CharField(max_length=14, choices=Status.choices, default=Status.TO_PICK)
    vehicle_no = models.CharField(max_length=20, blank=True)
    driver_name = models.CharField(max_length=60, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    received_by = models.CharField(max_length=80, blank=True)
    truck_value_paise = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            self.code = f"DN-{self.pk:04d}"
            type(self).objects.filter(pk=self.pk).update(code=self.code)


class DispatchLine(models.Model):
    dispatch = models.ForeignKey(Dispatch, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="+")
    qty_required = models.DecimalField(max_digits=10, decimal_places=2)
    qty_picked = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]

    @property
    def complete(self):
        return self.qty_picked >= self.qty_required

    @property
    def remaining(self):
        return max(self.qty_required - self.qty_picked, 0)


class Serial(models.Model):
    class Status(models.TextChoices):
        IN_STOCK = "in_stock", "In stock"
        RESERVED = "reserved", "Picked"
        DISPATCHED = "dispatched", "Dispatched"
        DELIVERED = "delivered", "Delivered"
        REPLACED = "replaced", "Replaced (faulty)"
        RETURNED = "returned", "Returned to supplier"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="serials")
    serial_no = models.CharField(max_length=60, unique=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.IN_STOCK, db_index=True)
    unit_cost_paise = models.PositiveBigIntegerField(default=0)
    purchase_line = models.ForeignKey(PurchaseLine, null=True, blank=True, on_delete=models.SET_NULL, related_name="serials")
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name="serials")
    dispatch = models.ForeignKey(Dispatch, null=True, blank=True, on_delete=models.SET_NULL, related_name="serials")
    delivered_at = models.DateTimeField(null=True, blank=True)
    warranty_start = models.DateField(null=True, blank=True)
    warranty_end = models.DateField(null=True, blank=True)
    warranty_months = models.PositiveIntegerField(null=True, blank=True)
    replaces = models.OneToOneField("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="replaced_by")
    exclusion_reason = models.CharField(max_length=200, blank=True, help_text="Warranty void (e.g. physical damage)")
    received_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["product", "serial_no"]

    @property
    def warranty(self):
        from .calc.warranty import warranty_state
        return warranty_state(self)

    def __str__(self):
        return self.serial_no


class StockMove(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="moves")
    qty_delta = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=12)  # receipt, dispatch, ticket, adjust
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    unit_cost_paise = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(default=clock.now)


# --------------------------------------------------------------------------- field work
class InstallJob(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        SIGNED_OFF = "signed_off", "Signed off"

    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="job")
    scheduled_date = models.DateField(null=True, blank=True)
    customer_confirmed_at = models.DateTimeField(null=True, blank=True)
    reschedule_request = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SCHEDULED)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    kw_confirmed = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    kw_note = models.CharField(max_length=200, blank=True)
    check_stands = models.BooleanField(default=False)
    check_panels = models.BooleanField(default=False)
    check_boxes = models.BooleanField(default=False)
    check_earthing = models.BooleanField(default=False)
    check_generation = models.BooleanField(default=False)
    test_reading_kw = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    signed_by = models.CharField(max_length=120, blank=True)
    signature = models.TextField(blank=True, help_text="PNG/SVG data URL")
    signed_at = models.DateTimeField(null=True, blank=True)
    geo_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geo_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    notes = models.TextField(blank=True)

    @property
    def hours(self):
        if self.started_at and self.finished_at:
            return Decimal((self.finished_at - self.started_at).total_seconds() / 3600).quantize(Decimal("0.01"))
        return Decimal("0")


class JobAssignment(models.Model):
    job = models.ForeignKey(InstallJob, on_delete=models.CASCADE, related_name="assignments")
    technician = models.ForeignKey(User, on_delete=models.PROTECT, related_name="job_assignments")
    role = models.CharField(max_length=6, default="helper")  # lead / helper
    present = models.BooleanField(default=False)
    hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]


# --------------------------------------------------------------------------- after-sales
class Ticket(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        ASSIGNED = "assigned", "Assigned"
        RESOLVED = "resolved", "Resolved, awaiting customer"
        CLOSED = "closed", "Closed"
        REOPENED = "reopened", "Reopened"

    class Source(models.TextChoices):
        PORTAL = "portal", "Customer portal"
        CALL = "call", "Phone call"
        WHATSAPP = "whatsapp", "WhatsApp"
        STAFF = "staff", "Staff"

    code = models.CharField(max_length=12, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="tickets")
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets")
    serial = models.ForeignKey(Serial, null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets")
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.CALL)
    fault_code = models.CharField(max_length=30, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.NEW, db_index=True)
    covered = models.BooleanField(null=True, blank=True)
    coverage_note = models.CharField(max_length=200, blank=True)
    assignee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets")
    visit_date = models.DateField(null=True, blank=True)
    reopen_count = models.PositiveSmallIntegerField(default=0)
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    close_override_reason = models.CharField(max_length=200, blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-created_at", "-id"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            self.code = f"TK-{self.pk:04d}"
            type(self).objects.filter(pk=self.pk).update(code=self.code)

    @property
    def is_open(self):
        return self.status != self.Status.CLOSED


class TicketLine(models.Model):
    class Kind(models.TextChoices):
        PART = "part", "Part"
        LABOUR = "labour", "Labour"
        VISIT = "visit", "Visit"

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="lines")
    kind = models.CharField(max_length=7, choices=Kind.choices)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.PROTECT, related_name="+")
    serial = models.ForeignKey(Serial, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    description = models.CharField(max_length=200)
    qty = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    unit_cost_paise = models.BigIntegerField(default=0)
    unit_price_paise = models.BigIntegerField(default=0)
    billable = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]


# --------------------------------------------------------------------------- workflow plumbing
class Task(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        DONE = "done", "Done"
        NA = "na", "Not applicable"
        BLOCKED = "blocked", "Waiting"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    kind = models.CharField(max_length=20)  # first_call, followup, collect_advance, verify_payment, collect_balance, subsidy, other
    title = models.CharField(max_length=200)
    seq = models.PositiveSmallIntegerField(default=0)
    owner_role = models.CharField(max_length=12, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    done_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.OPEN)
    payment = models.ForeignKey(Payment, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["seq", "due_at", "id"]

    @property
    def overdue(self):
        return self.status == self.Status.OPEN and self.due_at and self.due_at < clock.now()


class LedgerEntry(models.Model):
    class Kind(models.TextChoices):
        REVENUE = "revenue", "Revenue"
        COST = "cost", "Cost"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="ledger")
    kind = models.CharField(max_length=7, choices=Kind.choices)
    category = models.CharField(max_length=20)
    amount_paise = models.BigIntegerField()
    occurred_at = models.DateTimeField(default=clock.now)
    ref_type = models.CharField(max_length=20, blank=True)
    ref_id = models.PositiveBigIntegerField(null=True, blank=True)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["occurred_at", "id"]


class TimelineEvent(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="timeline")
    at = models.DateTimeField(default=clock.now, db_index=True)
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    kind = models.CharField(max_length=20, default="info")
    message = models.CharField(max_length=300)
    customer_message = models.CharField(max_length=300, blank=True, help_text="Empty = internal only")

    class Meta:
        ordering = ["-at", "-id"]


class Notification(models.Model):
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=160)
    body = models.CharField(max_length=300, blank=True)
    link = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(default=clock.now)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class MessageLog(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="messages")
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name="messages")
    channel = models.CharField(max_length=10, default="whatsapp")
    template = models.CharField(max_length=30, blank=True)
    body = models.TextField()
    wa_link = models.URLField(max_length=1000, blank=True)
    created_at = models.DateTimeField(default=clock.now)

    class Meta:
        ordering = ["-created_at", "-id"]


class Snapshot(models.Model):
    token = models.CharField(max_length=40, unique=True)
    period = models.CharField(max_length=10)
    payload = models.JSONField(default=dict)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(default=clock.now)
    expires_at = models.DateTimeField()


class Config(models.Model):
    key = models.CharField(max_length=40, unique=True)
    value = models.TextField(help_text="JSON")

    def __str__(self):
        return self.key
