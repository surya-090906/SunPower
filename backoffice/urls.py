from django.urls import path

from . import views_accounts as acc
from . import views_crm as crm
from . import views_field as fld
from . import views_help as hlp
from . import views_inventory as inv

urlpatterns = [
    path("", crm.home, name="bo_home"),
    # CRM
    path("crm/", crm.pipeline, name="bo_pipeline"),
    path("crm/new/", crm.quick_add, name="bo_quick_add"),
    path("p/<int:pk>/", crm.project_detail, name="bo_project"),
    path("p/<int:pk>/do/<str:action>/", crm.project_action, name="bo_project_action"),
    # Inventory
    path("inventory/", inv.overview, name="bo_inventory"),
    path("inventory/receive/", inv.receive, name="bo_receive"),
    path("inventory/serials/", inv.serials, name="bo_serials"),
    path("inventory/serials/<int:pk>/", inv.serial_detail, name="bo_serial"),
    path("inventory/dispatch/", inv.dispatch_list, name="bo_dispatches"),
    path("inventory/dispatch/<int:pk>/", inv.dispatch_detail, name="bo_dispatch"),
    path("inventory/dispatch/<int:pk>/do/", inv.dispatch_do, name="bo_dispatch_do"),
    # Field
    path("field/", fld.my_day, name="bo_field"),
    path("field/schedule/", fld.schedule, name="bo_schedule"),
    path("field/survey/<int:pk>/", fld.survey_form, name="bo_survey_form"),
    path("field/install/<int:pk>/", fld.install_form, name="bo_install_form"),
    path("field/delivery/<int:pk>/", fld.delivery, name="bo_delivery"),
    path("field/photo/", fld.photo_upload, name="bo_photo"),
    # Helpdesk
    path("help/", hlp.search, name="bo_help"),
    path("help/customer/<int:pk>/", hlp.customer360, name="bo_customer"),
    path("help/ticket/new/", hlp.ticket_new, name="bo_ticket_new"),
    path("help/tickets/", hlp.tickets, name="bo_tickets"),
    path("help/tickets/<int:pk>/", hlp.ticket_detail, name="bo_ticket"),
    path("help/tickets/<int:pk>/do/", hlp.ticket_do, name="bo_ticket_do"),
    # Accounting
    path("accounts/", acc.accounts, name="bo_accounts"),
    path("accounts/verify/<int:pk>/", acc.verify, name="bo_verify"),
    path("accounts/task/<int:pk>/done/", acc.task_done, name="bo_task_done"),
    path("accounts/cost/", acc.add_cost, name="bo_add_cost"),
    path("accounts/payroll.csv", acc.payroll_csv, name="bo_payroll_csv"),
    # Insights
    path("insights/", acc.dashboard, name="bo_insights"),
    path("insights/p/<int:pk>/", acc.job_detail, name="bo_job_profit"),
    path("insights/share/", acc.share, name="bo_share"),
    path("insights/export.csv", acc.export_csv, name="bo_export"),
]
