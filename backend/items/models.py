from django.conf import settings
from django.db import models
from django.utils import timezone
from locations.models import Location

class Store(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="store"
    )
    nama_toko = models.CharField(max_length=150)
    kontak_wa = models.CharField(max_length=20)
    lokasi = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.nama_toko


class Item(models.Model):
    class Condition(models.TextChoices):
        LAYAK_MAKAN = "layak_makan", "Masih Layak Dimakan"
        BYPRODUCT = "byproduct", "Byproduct"

    class ListingType(models.TextChoices):
        DISKON = "diskon", "Jual Diskon"
        DONASI = "donasi", "Donasi"
       
    class Status(models.TextChoices):
        TERSEDIA = 'Tersedia'
        TERSEDIA_SEBAGIAN = 'Tersedia Sebagian'
        HABIS = 'Habis'
        SELESAI = 'Selesai'
        KADALUARSA = 'Kadaluarsa'

    UNIT_CHOICES = [
        ("kg", "Kilogram"),
        ("liter", "Liter"),
        ("pcs", "Pcs"),
        ("bungkus", "Bungkus"),
        ("porsi", "Porsi"),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="items")

    name = models.CharField("Nama Item", max_length=150)
    condition = models.CharField(max_length=20, choices=Condition.choices)
    listing_type = models.CharField(
        max_length=20, choices=ListingType.choices, null=True, blank=True
    )  
    quantity_total = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_remaining = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    description = models.TextField("Deskripsi", blank=True)
    category = models.CharField("Kategori", max_length=100, blank=True)

    pickup_start = models.TimeField(null=True, blank=True)
    pickup_end = models.TimeField(null=True, blank=True)
    pickup_date_start = models.DateField(null=True, blank=True)
    pickup_date_end = models.DateField(null=True, blank=True)

    price_original = models.PositiveIntegerField("Harga Asli", null=True, blank=True)
    price_sale = models.PositiveIntegerField("Harga Jual", null=True, blank=True)
    best_before = models.DateField("Baik Dikonsumsi Sebelum", null=True, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TERSEDIA)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_reported = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.get_condition_display()})"

    def save(self, *args, **kwargs):
        if self._state.adding and self.quantity_remaining is None:
            self.quantity_remaining = self.quantity_total
        super().save(*args, **kwargs)

    def pickup_window_has_ended(self):
        if not self.pickup_date_end:
            return False

        today = timezone.localdate()

        if self.pickup_date_end < today:
            return True
        if self.pickup_date_end > today or not self.pickup_end:
            return False

        return self.pickup_end < timezone.localtime().time()

    def expire_if_overdue(self):
        expirable_statuses = {
            self.Status.TERSEDIA,
            self.Status.TERSEDIA_SEBAGIAN,
        }

        if (
            self.condition != self.Condition.BYPRODUCT
            or self.status not in expirable_statuses
            or not self.pickup_window_has_ended()
            or self.klaim_list.exists()
        ):
            return False

        self.status = self.Status.KADALUARSA
        self.save(update_fields=["status", "updated_at"])
        return True

    def apply_claim(self, jumlah_klaim):
        self.expire_if_overdue()

        claimable_statuses = {
            self.Status.TERSEDIA,
            self.Status.TERSEDIA_SEBAGIAN,
        }

        if self.status not in claimable_statuses:
            raise ValueError("Item tidak tersedia untuk diklaim.")
        if jumlah_klaim is None or jumlah_klaim <= 0:
            raise ValueError("Jumlah klaim harus lebih dari 0")
        if jumlah_klaim > self.quantity_remaining:
            raise ValueError("Jumlah klaim melebihi sisa stok")

        self.quantity_remaining -= jumlah_klaim
        self.status = (
            self.Status.HABIS
            if self.quantity_remaining == 0
            else self.Status.TERSEDIA_SEBAGIAN
        )
        self.save(
            update_fields=[
                "quantity_remaining",
                "status",
                "updated_at",
            ]
        )


class ItemImage(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="items/%Y/%m/")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

class Klaim(models.Model):
    class StatusKlaim(models.TextChoices):
        MENUNGGU = 'Menunggu'
        SELESAI = 'Selesai'
        BATAL = 'Batal'

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='klaim_list')
    peminat = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    jumlah_diklaim = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=StatusKlaim.choices, default=StatusKlaim.MENUNGGU)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
