from django.urls import path

from .views import impact_dashboard, my_impact

urlpatterns = [
    path(
        "dashboard/",
        impact_dashboard,
        name="impact-dashboard",
    ),
    path(
        "me/",
        my_impact,
        name="my-impact",
    ),
]
