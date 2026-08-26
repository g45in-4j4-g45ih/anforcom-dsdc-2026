from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Item, Klaim
from .serializers import CheckoutInputSerializer, ItemSerializer, KlaimManagementSerializer

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
def checkout_item(request, pk):
    """
    Bikin Klaim baru buat 1 item. Body: jumlah, pickup_method, pickup_time
    (kalau self_pickup), address_text/lat/lng (kalau ojek), shipping_cost, notes.

    Item donasi otomatis langsung berstatus DIBAYAR (skip step bayar).
    Item jual-diskon berstatus MENUNGGU_PEMBAYARAN, nunggu self-report lewat
    endpoint mark_klaim_paid setelah scan QRIS toko.
    """
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
    """Poster tandai klaim selesai setelah serah-terima — trigger Impact Counter."""
    klaim = generics.get_object_or_404(Klaim, pk=klaim_id)

    if klaim.item.store.owner != request.user:
        return Response({"error": "Bukan item milikmu."}, status=status.HTTP_403_FORBIDDEN)

    if klaim.status == Klaim.StatusKlaim.SELESAI:
        return Response({"error": "Klaim sudah selesai."}, status=status.HTTP_400_BAD_REQUEST)

    if klaim.status not in (Klaim.StatusKlaim.DIBAYAR,):
        return Response(
            {"error": "Klaim baru bisa ditandai selesai setelah dibayar."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    klaim.status = Klaim.StatusKlaim.SELESAI
    klaim.completed_at = timezone.now()
    klaim.save(update_fields=["status", "completed_at"])

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