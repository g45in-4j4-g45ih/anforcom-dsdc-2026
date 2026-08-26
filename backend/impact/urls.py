from django.urls import path

from .views import impact_dashboard, impact_history, my_impact

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
    path(
        "history/",
        impact_history,
        name="impact-history",
    ),
]
