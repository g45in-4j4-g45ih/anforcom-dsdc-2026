from decimal import Decimal, InvalidOperation
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Item, Klaim
from .serializers import ItemSerializer

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
        if hasattr(self.request.user, 'store'):
            return Item.objects.filter(store=self.request.user.store)
        return Item.objects.none()

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkout_item(request, pk):
    jumlah = request.data.get("jumlah")

    try:
        jumlah_decimal = Decimal(jumlah) if jumlah else None
    except InvalidOperation:
        return Response({"error": "Format jumlah tidak valid."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        item = generics.get_object_or_404(Item.objects.select_for_update(), pk=pk)

        try:
            item.apply_claim(jumlah_decimal)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        Klaim.objects.create(item=item, peminat=request.user, jumlah_diklaim=jumlah_decimal)

    return Response(ItemSerializer(item).data)

@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def tandai_selesai(request, klaim_id):
    klaim = generics.get_object_or_404(Klaim, pk=klaim_id)
    
    if klaim.item.store.owner != request.user:
        return Response({"error": "Bukan item milikmu."}, status=status.HTTP_403_FORBIDDEN)
        
    if klaim.status != Klaim.StatusKlaim.MENUNGGU:
        return Response(
            {"error": "Hanya klaim Menunggu yang dapat diselesaikan."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    klaim.status = Klaim.StatusKlaim.SELESAI
    klaim.completed_at = timezone.now()
    klaim.save(update_fields=["status", "completed_at"])
    
    return Response({"message": "Klaim ditandai selesai."})