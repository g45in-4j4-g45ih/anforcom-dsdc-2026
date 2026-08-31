from decimal import Decimal
 
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import CartItem, Item, Klaim, Store
from .serializers import (
    CartCheckoutSerializer,
    CartItemSerializer,
    CheckoutInputSerializer,
    ItemSerializer,
    KlaimManagementSerializer,
    StoreSerializer,
)


class StoreListCreateView(generics.ListCreateAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        owner_id = self.request.query_params.get("owner")
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        return qs

    def perform_create(self, serializer):
        if hasattr(self.request.user, "store"):
            raise ValidationError({"detail": "Kamu udah punya toko."})
        serializer.save()


class StoreDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.method in permissions.SAFE_METHODS:
            return Store.objects.all()
        return Store.objects.filter(owner=self.request.user)

class ItemListCreateView(generics.ListCreateAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        condition = self.request.query_params.get("condition")
        listing_type = self.request.query_params.get("listing_type")
        status_param = self.request.query_params.get("status")
        store_id = self.request.query_params.get("store")

        if condition:
            qs = qs.filter(condition=condition)
        if listing_type:
            qs = qs.filter(listing_type=listing_type)
        if status_param:
            qs = qs.filter(status=status_param)
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "store"):
            raise ValidationError({"detail": "Kamu harus membuat toko terlebih dahulu sebelum menambahkan produk."})
        
        status_input = self.request.data.get("status", Item.Status.TERSEDIA)
        serializer.save(store=self.request.user.store, status=status_input)

class ItemDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.method in permissions.SAFE_METHODS:
            return Item.objects.all()
        if hasattr(self.request.user, "store"):
            return Item.objects.filter(store=self.request.user.store)
        return Item.objects.none()

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def report_item(request, pk):
    item = generics.get_object_or_404(Item, pk=pk)

    if item.store.owner_id == request.user.id:
        return Response(
            {
                "error": (
                    "Kamu tidak dapat melaporkan item "
                    "milik sendiri."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if item.is_reported:
        return Response(
            {
                "message": "Item sudah pernah dilaporkan.",
                "is_reported": True,
            },
            status=status.HTTP_200_OK,
        )

    item.is_reported = True
    item.save(update_fields=["is_reported", "updated_at"])

    return Response(
        {
            "message": "Item berhasil dilaporkan.",
            "is_reported": True,
        },
        status=status.HTTP_200_OK,
    )

# ===== Cart =====
 
class CartListView(generics.ListAPIView):
    """GET /api/cart/ — isi keranjang user, dikelompokkan per toko."""
 
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
 
    def get_queryset(self):
        return CartItem.objects.filter(buyer=self.request.user).select_related(
            "item", "item__store"
        )
 
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
 
        grouped = {}
        for entry in serializer.data:
            store_id = entry["store_id"]
            grouped.setdefault(
                store_id, {"store_id": store_id, "store_name": entry["store_name"], "items": []}
            )
            grouped[store_id]["items"].append(entry)
 
        return Response(list(grouped.values()))
 
 
class CartItemCreateView(generics.CreateAPIView):
    """POST /api/cart/items/ — tambah item ke keranjang.
    Kalau item yang sama udah ada, quantity-nya ditambah (bukan bikin row baru)."""
 
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
 
    def create(self, request, *args, **kwargs):
        item_id = request.data.get("item")
        quantity = Decimal(str(request.data.get("quantity", 1)))
 
        existing = CartItem.objects.filter(buyer=request.user, item_id=item_id).first()
        if existing:
            new_quantity = existing.quantity + quantity
            item = existing.item
            if new_quantity > item.quantity_remaining:
                return Response(
                    {"error": f"Stok '{item.name}' cuma tersisa {item.quantity_remaining} {item.unit}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            existing.quantity = new_quantity
            existing.save(update_fields=["quantity"])
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)
 
        serializer = self.get_serializer(data={"item": item_id, "quantity": str(quantity)})
        serializer.is_valid(raise_exception=True)
        serializer.save(buyer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
 
 
class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH (ubah quantity) / DELETE (hapus) /api/cart/items/<id>/"""
 
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
 
    def get_queryset(self):
        return CartItem.objects.filter(buyer=self.request.user)
 
 
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cart_checkout(request):
    input_serializer = CartCheckoutSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)
    data = input_serializer.validated_data

    cart_items = list(
        CartItem.objects.filter(
            buyer=request.user,
            item__store_id=data["store_id"],
            id__in=data["cart_item_ids"],
        ).select_related("item")
    )
    if not cart_items:
        return Response(
            {"error": "Item yang dipilih tidak ditemukan di keranjang."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(cart_items) != len(data["cart_item_ids"]):
        return Response(
            {"error": "Sebagian item yang dipilih tidak valid atau sudah tidak ada."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    created_klaim = []
    shipping_cost = data.get("shipping_cost", 0)

    with transaction.atomic():
        for index, cart_entry in enumerate(cart_items):
            item = Item.objects.select_for_update().get(pk=cart_entry.item_id)

            try:
                item.apply_claim(cart_entry.quantity)
            except ValueError as e:
                transaction.set_rollback(True)
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            is_free = item.listing_type != Item.ListingType.DISKON
            price = item.price_sale if not is_free else None
            subtotal = int(price * cart_entry.quantity) if price else 0
            this_shipping = shipping_cost if index == 0 else 0
            total_price = subtotal + (0 if is_free else this_shipping)

            klaim = Klaim.objects.create(
                item=item,
                peminat=request.user,
                jumlah_diklaim=cart_entry.quantity,
                price_at_claim=price,
                total_price=total_price,
                pickup_method=data["pickup_method"],
                pickup_time=data.get("pickup_time"),
                address_text=data.get("address_text", ""),
                address_lat=data.get("address_lat"),
                address_lng=data.get("address_lng"),
                shipping_cost=this_shipping,
                notes=data.get("notes", ""),
            )

            if is_free:
                klaim.status = Klaim.StatusKlaim.DIBAYAR
                klaim.paid_at = timezone.now()
                klaim.save(update_fields=["status", "paid_at"])

            created_klaim.append(klaim)
            cart_entry.delete()

    return Response(
        KlaimManagementSerializer(created_klaim, many=True).data,
        status=status.HTTP_201_CREATED,
    )

# ==== Checkout ====

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkout_item(request, pk):
    input_serializer = CheckoutInputSerializer(data=request.data)
    input_serializer.is_valid(raise_exception=True)
    data = input_serializer.validated_data

    with transaction.atomic():
        item = generics.get_object_or_404(Item.objects.select_for_update(), pk=pk)

        try:
            item.apply_claim(data["jumlah"])
        except ValueError as e:
            transaction.set_rollback(True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        is_free = item.listing_type != Item.ListingType.DISKON
        price = item.price_sale if not is_free else None
        subtotal = int(price * data["jumlah"]) if price else 0
        shipping_cost = data.get("shipping_cost", 0)
        total_price = subtotal + (0 if is_free else shipping_cost)

        klaim = Klaim.objects.create(
            item=item,
            peminat=request.user,
            jumlah_diklaim=data["jumlah"],
            price_at_claim=price,
            total_price=total_price,
            pickup_method=data["pickup_method"],
            pickup_time=data.get("pickup_time"),
            address_text=data.get("address_text", ""),
            address_lat=data.get("address_lat"),
            address_lng=data.get("address_lng"),
            shipping_cost=shipping_cost,
            notes=data.get("notes", ""),
        )

        if is_free:
            klaim.status = Klaim.StatusKlaim.DIBAYAR
            klaim.paid_at = timezone.now()
            klaim.save(update_fields=["status", "paid_at"])

    return Response(KlaimManagementSerializer(klaim).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def mark_klaim_paid(request, klaim_id):
    """Self-report: pembeli klik 'Saya Sudah Bayar' setelah scan QRIS toko."""
    klaim = generics.get_object_or_404(Klaim, pk=klaim_id, peminat=request.user)
    if klaim.status != Klaim.StatusKlaim.MENUNGGU_PEMBAYARAN:
        return Response(
            {"error": "Klaim ini tidak dalam status menunggu pembayaran."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    klaim.status = Klaim.StatusKlaim.DIBAYAR
    klaim.paid_at = timezone.now()
    klaim.save(update_fields=["status", "paid_at"])
    return Response(KlaimManagementSerializer(klaim).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def batal_klaim(request, klaim_id):
    """Batalkan klaim — cuma bisa sebelum dibayar. Stok dikembalikan otomatis."""
    klaim = generics.get_object_or_404(Klaim, pk=klaim_id, peminat=request.user)
    if klaim.status != Klaim.StatusKlaim.MENUNGGU_PEMBAYARAN:
        return Response(
            {"error": "Klaim yang sudah dibayar/selesai tidak bisa dibatalkan."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        klaim.item.release_claim(klaim.jumlah_diklaim)
        klaim.status = Klaim.StatusKlaim.BATAL
        klaim.cancelled_at = timezone.now()
        klaim.save(update_fields=["status", "cancelled_at"])

    return Response(KlaimManagementSerializer(klaim).data)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def tandai_selesai(request, klaim_id):
    with transaction.atomic():
        klaim = generics.get_object_or_404(
            Klaim.objects.select_for_update().select_related(
                "item__store"
            ),
            pk=klaim_id,
        )
        item = Item.objects.select_for_update().get(
            pk=klaim.item_id
        )

        if item.store.owner_id != request.user.id:
            return Response(
                {"error": "Bukan item milikmu."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if klaim.status != Klaim.StatusKlaim.SELESAI:
            if klaim.status != Klaim.StatusKlaim.DIBAYAR:
                return Response(
                    {
                        "error": (
                            "Klaim baru bisa ditandai selesai "
                            "setelah dibayar."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            klaim.status = Klaim.StatusKlaim.SELESAI
            klaim.completed_at = timezone.now()
            klaim.save(
                update_fields=["status", "completed_at"]
            )

        has_active_claims = item.klaim_list.exclude(
            status__in=[
                Klaim.StatusKlaim.SELESAI,
                Klaim.StatusKlaim.BATAL,
            ]
        ).exists()

        if item.quantity_remaining == 0:
            next_item_status = (
                Item.Status.HABIS
                if has_active_claims
                else Item.Status.SELESAI
            )
        else:
            next_item_status = Item.Status.TERSEDIA

        if item.status != next_item_status:
            item.status = next_item_status
            item.save(
                update_fields=["status", "updated_at"]
            )

    return Response(KlaimManagementSerializer(klaim).data)


class MyKlaimView(generics.ListAPIView):
    """Riwayat klaim/pesanan milik pembeli yang login."""

    serializer_class = KlaimManagementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Klaim.objects.filter(peminat=self.request.user)


class StoreKlaimView(generics.ListAPIView):
    """Klaim/pesanan masuk buat poster (dashboard penjual)."""

    serializer_class = KlaimManagementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, "store"):
            return Klaim.objects.none()
        return Klaim.objects.filter(item__store=self.request.user.store)