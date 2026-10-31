"""Django admin doubles as the Settings area: products, kit templates, config, users."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from . import models as m


@admin.register(m.User)
class SunUserAdmin(UserAdmin):
    list_display = ("username", "first_name", "last_name", "role", "phone", "is_active")
    list_filter = ("role", "is_active")
    fieldsets = UserAdmin.fieldsets + (("SunThread", {"fields": ("role", "phone", "hourly_rate_paise", "can_survey", "demo_pin")}),)


class KitLineInline(admin.TabularInline):
    model = m.KitLine
    extra = 0


@admin.register(m.KitTemplate)
class KitTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "kw", "requires_survey", "active")
    inlines = [KitLineInline]


@admin.register(m.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "category", "tracked_by_serial", "warranty_months", "cost_paise", "price_paise", "tax_pct", "active")
    list_filter = ("category", "tracked_by_serial", "active")
    search_fields = ("sku", "name")


@admin.register(m.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("code", "customer", "kind", "requested_kw", "stage", "owner", "created_at")
    list_filter = ("stage", "kind", "source")
    search_fields = ("code", "customer__name", "customer__phone")


@admin.register(m.Serial)
class SerialAdmin(admin.ModelAdmin):
    list_display = ("serial_no", "product", "status", "project", "warranty_end")
    list_filter = ("status", "product__category")
    search_fields = ("serial_no",)


@admin.register(m.Config)
class ConfigAdmin(admin.ModelAdmin):
    list_display = ("key", "value")


for model in (m.Customer, m.Survey, m.Quote, m.Payment, m.Invoice, m.Dispatch, m.InstallJob, m.Ticket, m.Task,
              m.LedgerEntry, m.TimelineEvent, m.Supplier, m.PurchaseReceipt, m.StockMove, m.Notification, m.MessageLog):
    admin.site.register(model)
