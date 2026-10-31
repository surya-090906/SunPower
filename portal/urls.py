from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="portal_home"),
    path("p/<int:pk>/", views.project, name="portal_project"),
    path("p/<int:pk>/quote/", views.quote, name="portal_quote"),
    path("p/<int:pk>/pay/", views.pay, name="portal_pay"),
    path("p/<int:pk>/slot/<str:kind>/", views.slot, name="portal_slot"),
    path("systems/", views.systems, name="portal_systems"),
    path("requests/", views.requests_list, name="portal_requests"),
    path("requests/new/", views.request_new, name="portal_request_new"),
    path("requests/<int:pk>/", views.request_detail, name="portal_request"),
    path("requests/<int:pk>/confirm/", views.request_confirm, name="portal_request_confirm"),
]
