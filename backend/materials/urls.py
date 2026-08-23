from django.urls import path

from .views import MaterialDetailView, MaterialListView

urlpatterns = [
    path("", MaterialListView.as_view(), name="material-list"),
    path("<int:pk>/", MaterialDetailView.as_view(), name="material-detail"),
]
