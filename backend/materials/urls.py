from django.urls import path

from .views import (
    MaterialDetailView,
    MaterialListView,
    MaterialManagementListView,
)

urlpatterns = [
    path("", MaterialListView.as_view(), name="material-list"),
    path(
        "mine/",
        MaterialManagementListView.as_view(),
        name="material-management-list",
    ),
    path("<int:pk>/", MaterialDetailView.as_view(), name="material-detail"),
]
