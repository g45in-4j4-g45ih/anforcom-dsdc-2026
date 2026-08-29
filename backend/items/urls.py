from django.urls import path
 
from .views import (
    CartItemCreateView,
    CartItemDetailView,
    CartListView,
    ItemDetailView,
    ItemListCreateView,
    MyKlaimView,
    StoreDetailView,
    StoreKlaimView,
    StoreListCreateView,
    batal_klaim,
    cart_checkout,
    checkout_item,
    mark_klaim_paid,
    tandai_selesai,
)

urlpatterns = [
    path("items/", ItemListCreateView.as_view(), name="item-list-create"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="item-detail"),
    path("items/<int:pk>/checkout/", checkout_item, name="item-checkout"),

    path("cart/", CartListView.as_view(), name="cart-list"),
    path("cart/items/", CartItemCreateView.as_view(), name="cart-item-create"),
    path("cart/items/<int:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("cart/checkout/", cart_checkout, name="cart-checkout"),

    path("klaim/mine/", MyKlaimView.as_view(), name="klaim-mine"),
    path("klaim/store/", StoreKlaimView.as_view(), name="klaim-store"),
    path("klaim/<int:klaim_id>/mark-paid/", mark_klaim_paid, name="klaim-mark-paid"),
    path("klaim/<int:klaim_id>/batalkan/", batal_klaim, name="klaim-batalkan"),
    path("klaim/<int:klaim_id>/tandai-selesai/", tandai_selesai, name="klaim-tandai-selesai"),
   
  path("stores/", StoreListCreateView.as_view(), name="store-list-create"),
    path("stores/<int:pk>/", StoreDetailView.as_view(), name="store-detail"),
]
