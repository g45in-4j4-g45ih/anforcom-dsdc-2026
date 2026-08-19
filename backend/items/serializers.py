from rest_framework import serializers

from .models import Item, ItemImage


class ItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = ["id", "image", "order"]


class ItemSerializer(serializers.ModelSerializer):
    images = ItemImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False, allow_empty=True
    )

    class Meta:
        model = Item
        fields = [
            "id", "name", "condition", "quantity_total", "quantity_remaining", "unit",
            "description","category", "pickup_start", "pickup_end", "price_original", 
            "price_sale","best_before", "status", "images", "uploaded_images", "created_at",
        ]
        read_only_fields = ["id", "quantity_remaining", "status", "created_at"]

    def validate(self, data):
        condition = data.get("condition")
        if condition == Item.Condition.LAYAK_MAKAN and not data.get("price_sale"):
            raise serializers.ValidationError({"price_sale": "Wajib diisi untuk item yang masih layak dimakan."})
        return data

    def create(self, validated_data):
        images_data = validated_data.pop("uploaded_images", [])
        validated_data["quantity_remaining"] = validated_data["quantity_total"]
        item = Item.objects.create(**validated_data)
        for order, image_file in enumerate(images_data):
            ItemImage.objects.create(item=item, image=image_file, order=order)
        return item