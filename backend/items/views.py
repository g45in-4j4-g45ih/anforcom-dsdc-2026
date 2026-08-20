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
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkout_item(request, pk):
    item = generics.get_object_or_404(Item, pk=pk)
    jumlah = request.data.get("jumlah")

    try:
        item.apply_claim(float(jumlah) if jumlah else None)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    Klaim.objects.create(item=item, peminat=request.user, jumlah_diklaim=jumlah)

    return Response(ItemSerializer(item).data)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def tandai_selesai(request, pk):
    item = generics.get_object_or_404(Item, pk=pk)
    if item.store.owner != request.user:
        return Response({"error": "Bukan item milikmu."}, status=status.HTTP_403_FORBIDDEN)
    item.status = Item.Status.HABIS
    item.save(update_fields=["status", "updated_at"])
    return Response(ItemSerializer(item).data)