from django.urls import path

from .views import impact_dashboard

urlpatterns = [
    path(
        "dashboard/",
        impact_dashboard,
        name="impact-dashboard",
    ),
]
