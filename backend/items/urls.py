from django.urls import path

from .views import (
    ItemListCreateView,
    ItemDetailView,
    StoreListCreateView,
    StoreDetailView,
    checkout_item,
    tandai_selesai,
)

urlpatterns = [
    path("items/", ItemListCreateView.as_view(), name="item-list-create"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="item-detail"),
    path("items/<int:pk>/checkout/", checkout_item, name="item-checkout"),
    path("claims/<int:klaim_id>/tandai-selesai/", tandai_selesai, name="klaim-tandai-selesai"),
    path("stores/", StoreListCreateView.as_view(), name="store-list-create"),
    path("stores/<int:pk>/", StoreDetailView.as_view(), name="store-detail"),
]
