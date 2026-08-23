from django.db.models import Q
from rest_framework import generics, permissions

from items.models import Item

from .serializers import (
    MaterialManagementSerializer,
    MaterialSerializer,
)


class MaterialQuerysetMixin:
    serializer_class = MaterialSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
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