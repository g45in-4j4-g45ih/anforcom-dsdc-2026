from rest_framework import serializers

from locations.models import Location
from .models import CartItem, Item, ItemImage, Klaim, Store

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"


class StoreSerializer(serializers.ModelSerializer):
    lokasi_detail = LocationSerializer(source="lokasi", read_only=True)

    class Meta:
        model = Store
        fields = [
            "id", "owner", "nama_toko", "kontak_wa",
            "lokasi", "lokasi_detail", "description", "logo", "qris_image"
        ]
        read_only_fields = ["id", "owner"]

    def validate_logo(self, logo):
        max_size = 5 * 1024 * 1024
        if logo and logo.size > max_size:
            raise serializers.ValidationError("Ukuran logo maksimal 5MB.")
        return logo

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return Store.objects.create(**validated_data)


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
            data["listing_type"] = None

        return data

    def create(self, validated_data):
        images_data = validated_data.pop("uploaded_images", [])
        validated_data["quantity_remaining"] = validated_data["quantity_total"]
        if not hasattr(self.context["request"].user, "store"):
            raise serializers.ValidationError({"store": "Kamu belum setup Toko/Store."})

        validated_data["store"] = self.context["request"].user.store
        item = Item.objects.create(**validated_data)
        for order, image_file in enumerate(images_data):
            ItemImage.objects.create(item=item, image=image_file, order=order)
        return item
# ==== Cart ====

class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_image = serializers.SerializerMethodField()
    item_unit = serializers.CharField(source="item.unit", read_only=True)
    item_price = serializers.SerializerMethodField()
    item_stock = serializers.DecimalField(
        source="item.quantity_remaining", max_digits=10, decimal_places=2, read_only=True
    )
    item_status = serializers.CharField(source="item.status", read_only=True)
    store_id = serializers.IntegerField(source="item.store_id", read_only=True)
    store_name = serializers.CharField(source="item.store.nama_toko", read_only=True)
 
    class Meta:
        model = CartItem
        fields = [
            "id", "item", "item_name", "item_image", "item_unit", "item_price",
            "item_stock", "item_status", "store_id", "store_name", "quantity", "added_at",
        ]
        read_only_fields = ["id", "added_at"]
 
    def get_item_image(self, obj):
        first_image = obj.item.images.first()
        return first_image.image.url if first_image else None
 
    def get_item_price(self, obj):
        return obj.item.price_sale if obj.item.listing_type == Item.ListingType.DISKON else 0
 
    def validate(self, data):
        item = data.get("item") or (self.instance.item if self.instance else None)
        quantity = data.get("quantity")
        if item and quantity is not None and quantity > item.quantity_remaining:
            raise serializers.ValidationError(
                {"quantity": f"Stok cuma tersisa {item.quantity_remaining} {item.unit}"}
            )
        return data
 
 
class CartCheckoutSerializer(serializers.Serializer):
    """Input body buat POST /cart/checkout/ — checkout SEMUA CartItem
    milik user buat 1 store sekaligus."""
 
    store_id = serializers.IntegerField()
    pickup_method = serializers.ChoiceField(choices=Klaim.PickupMethod.choices)
    pickup_time = serializers.TimeField(required=False, allow_null=True)
    address_text = serializers.CharField(required=False, allow_blank=True)
    address_lat = serializers.FloatField(required=False, allow_null=True)
    address_lng = serializers.FloatField(required=False, allow_null=True)
    shipping_cost = serializers.IntegerField(required=False, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)
 
    def validate(self, data):
        if data["pickup_method"] == Klaim.PickupMethod.OJEK and not data.get("address_text"):
            raise serializers.ValidationError(
                {"address_text": "Alamat wajib diisi untuk pengiriman via ojek."}
            )
        if data["pickup_method"] == Klaim.PickupMethod.SELF_PICKUP and not data.get("pickup_time"):
            raise serializers.ValidationError({"pickup_time": "Wajib pilih jam pengambilan."})
        return data

# ===== Checkout =====

class CheckoutInputSerializer(serializers.Serializer):
    """Input body buat POST /items/<pk>/checkout/"""

    jumlah = serializers.DecimalField(max_digits=10, decimal_places=2)
    pickup_method = serializers.ChoiceField(choices=Klaim.PickupMethod.choices)
    pickup_time = serializers.TimeField(required=False, allow_null=True)
    address_text = serializers.CharField(required=False, allow_blank=True)
    address_lat = serializers.FloatField(required=False, allow_null=True)
    address_lng = serializers.FloatField(required=False, allow_null=True)
    shipping_cost = serializers.IntegerField(required=False, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["pickup_method"] == Klaim.PickupMethod.OJEK and not data.get("address_text"):
            raise serializers.ValidationError(
                {"address_text": "Alamat wajib diisi untuk pengiriman via ojek."}
            )
        if data["pickup_method"] == Klaim.PickupMethod.SELF_PICKUP and not data.get("pickup_time"):
            raise serializers.ValidationError({"pickup_time": "Wajib pilih jam pengambilan."})
        return data


class KlaimManagementSerializer(serializers.ModelSerializer):
    peminat_nama = serializers.CharField(source="peminat.username", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_image = serializers.SerializerMethodField()
    item_unit = serializers.CharField(source="item.unit", read_only=True)
    store_qris = serializers.ImageField(source="item.store.qris_image", read_only=True)
    store_kontak_wa = serializers.CharField(source="item.store.kontak_wa", read_only=True)

    class Meta:
        model = Klaim
        fields = [
            "id", "item", "item_name", "item_image", "item_unit",
            "peminat", "peminat_nama", "jumlah_diklaim",
            "status", "price_at_claim", "total_price",
            "pickup_method", "pickup_time",
            "address_text", "address_lat", "address_lng", "shipping_cost",
            "notes", "store_qris", "store_kontak_wa",
            "created_at", "paid_at", "completed_at", "cancelled_at",
        ]
        read_only_fields = [
            "id", "status", "price_at_claim", "total_price",
            "created_at", "paid_at", "completed_at", "cancelled_at",
        ]

    def get_item_image(self, obj):
        first_image = obj.item.images.first()
        return first_image.image.url if first_image else None