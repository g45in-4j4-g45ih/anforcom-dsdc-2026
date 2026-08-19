from django.urls import path

from .views import ItemDetailView, ItemListCreateView

urlpatterns = [
    path("items/", ItemListCreateView.as_view(), name="item-list-create"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="item-detail"),
]