from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from items.models import Item

from .serializers import (
    MaterialManagementSerializer,
    MaterialSerializer,
)


class MaterialQuerysetMixin:
    serializer_class = MaterialSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        overdue_candidates = (
            Item.objects.filter(
                condition=Item.Condition.BYPRODUCT,
                status__in=[
                    Item.Status.TERSEDIA,
                    Item.Status.TERSEDIA_SEBAGIAN,
                ],
                pickup_date_end__lte=timezone.localdate(),
            )
            .prefetch_related("klaim_list")
        )

        for material in overdue_candidates:
            material.expire_if_overdue()

        queryset = (
            Item.objects.filter(condition=Item.Condition.BYPRODUCT)
            .select_related("store__owner", "store__lokasi")
            .prefetch_related("images")
        )

        status_param = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")

        if status_param:
            queryset = queryset.filter(status=status_param)
        if category:
            queryset = queryset.filter(category__iexact=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(category__icontains=search)
            )

        return queryset


class MaterialListView(MaterialQuerysetMixin, generics.ListAPIView):
    pass


class MaterialDetailView(MaterialQuerysetMixin, generics.RetrieveAPIView):
    pass


class MaterialManagementListView(
    MaterialQuerysetMixin,
    generics.ListAPIView,
):
    serializer_class = MaterialManagementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(store__owner=self.request.user)
            .prefetch_related("klaim_list__peminat")
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def report_material(request, pk):
    material = generics.get_object_or_404(
        Item,
        pk=pk,
        condition=Item.Condition.BYPRODUCT,
    )

    if material.store.owner_id == request.user.id:
        return Response(
            {"error": "Kamu tidak dapat melaporkan material milik sendiri."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if material.is_reported:
        return Response(
            {
                "message": "Material sudah pernah dilaporkan.",
                "is_reported": True,
            },
            status=status.HTTP_200_OK,
        )

    material.is_reported = True
    material.save(update_fields=["is_reported", "updated_at"])

    return Response(
        {
            "message": "Material berhasil dilaporkan.",
            "is_reported": True,
        },
        status=status.HTTP_200_OK,
    )
