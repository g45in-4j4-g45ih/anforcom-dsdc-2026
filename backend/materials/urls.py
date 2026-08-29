from django.urls import path

from .views import (
    MaterialDetailView,
    MaterialListView,
    MaterialManagementListView,
    report_material,
)

urlpatterns = [
    path("", MaterialListView.as_view(), name="material-list"),
    path(
        "mine/",
        MaterialManagementListView.as_view(),
        name="material-management-list",
    ),
    path(
        "<int:pk>/report/",
        report_material,
        name="material-report",
    ),
    path("<int:pk>/", MaterialDetailView.as_view(), name="material-detail"),
]
