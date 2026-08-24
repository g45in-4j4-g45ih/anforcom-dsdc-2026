from rest_framework import serializers

from items.models import Item
from items.serializers import (
    ItemImageSerializer,
    KlaimManagementSerializer,
    LocationSerializer,
)


class MaterialSerializer(serializers.ModelSerializer):
    images = ItemImageSerializer(many=True, read_only=True)
    poster_name = serializers.CharField(
        source="store.owner.username",
        read_only=True,
    )
    store_name = serializers.CharField(
        source="store.nama_toko",
        read_only=True,
    )
    pickup_location = LocationSerializer(
        source="store.lokasi",
        read_only=True,
    )

    class Meta:
        model = Item
        fields = [
            "id",
            "name",
            "condition",
            "category",
            "description",
            "quantity_total",
            "quantity_remaining",
            "unit",
            "pickup_start",
            "pickup_end",
            "pickup_date_start",
            "pickup_date_end",
            "status",
            "is_reported",
            "images",
            "poster_name",
            "store_name",
            "pickup_location",
            "created_at",
        ]
        read_only_fields = fields


class MaterialManagementSerializer(MaterialSerializer):
    claims = KlaimManagementSerializer(
        source="klaim_list",
        many=True,
        read_only=True,
    )

    class Meta(MaterialSerializer.Meta):
        fields = [*MaterialSerializer.Meta.fields, "claims"]
        read_only_fields = fields
