from rest_framework import serializers

from .models import Item, ItemImage, Location, Store, Klaim


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"


class StoreSerializer(serializers.ModelSerializer):
    lokasi_detail = LocationSerializer(source="lokasi", read_only=True)

    class Meta:
        model = Store
        fields = ["id", "nama_toko", "kontak_wa", "lokasi", "lokasi_detail"]


class ItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = ["id", "image", "order"]


class ItemSerializer(serializers.ModelSerializer):
    images = ItemImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False, allow_empty=True
    )
    store_detail = StoreSerializer(source="store", read_only=True)

    class Meta:
        model = Item
        fields = [
            "id", "store", "store_detail", "name", "condition", "listing_type",
            "quantity_total", "quantity_remaining", "unit", "description", "category",
            "pickup_start", "pickup_end", "pickup_date_start", "pickup_date_end",
            "price_original", "price_sale", "best_before", "status",
            "images", "uploaded_images", "created_at",
        ]
        read_only_fields = ["id", "store", "quantity_remaining", "status", "created_at"]

    def validate(self, data):
        condition = data.get("condition")
        listing_type = data.get("listing_type")

        if condition == Item.Condition.LAYAK_MAKAN:
            if not listing_type:
                raise serializers.ValidationError(
                    {"listing_type": "Wajib pilih Jual Diskon atau Donasi."}
                )
            if listing_type == Item.ListingType.DISKON and not data.get("price_sale"):
                raise serializers.ValidationError(
                    {"price_sale": "Wajib diisi untuk listing jual diskon."}
                )
        elif condition == Item.Condition.BYPRODUCT:
            data["listing_type"] = None  # paksa kosong, byproduct nggak butuh ini

        return data

    def create(self, validated_data):
        images_data = validated_data.pop("uploaded_images", [])
        validated_data["quantity_remaining"] = validated_data["quantity_total"]
        validated_data["store"] = self.context["request"].user.store
        item = Item.objects.create(**validated_data)
        for order, image_file in enumerate(images_data):
            ItemImage.objects.create(item=item, image=image_file, order=order)
        return item


class KlaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Klaim
        fields = ["id", "item", "peminat", "jumlah_diklaim", "created_at"]
        read_only_fields = ["id", "peminat", "created_at"]