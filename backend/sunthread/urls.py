from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from core import docs, views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("enquire/", views.enquire, name="enquire"),
    path("claim/<str:token>/", views.claim, name="claim"),
    path("share/<str:token>/", views.share, name="share"),
    path("demo/switch/", views.demo_switch, name="demo_switch"),
    path("api/enquiry/", views.api_enquiry, name="api_enquiry"),
    path("api/notifications/count/", views.notifications_count, name="notifications_count"),
    path("notifications/", views.notifications, name="notifications"),
    path("notifications/read-all/", views.notifications_read_all, name="notifications_read_all"),
    path("notifications/<int:pk>/go/", views.notification_go, name="notification_go"),
    path("doc/quote/<int:pk>/", docs.quote_doc),
    path("doc/invoice/<int:pk>/", docs.invoice_doc),
    path("doc/delivery/<int:pk>/", docs.delivery_doc),
    path("doc/handover/<int:pk>/", docs.handover_doc),
    path("doc/warranty/<int:pk>/", docs.warranty_doc),
    path("doc/receipt/<int:pk>/", docs.receipt_doc),
    path("portal/", include("portal.urls")),
    path("app/", include("backoffice.urls")),
    path("admin/", admin.site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
