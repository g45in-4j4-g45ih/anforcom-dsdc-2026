from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from locations.models import Location

from .models import Item, Klaim, Store
from .serializers import ItemSerializer


class ItemClaimAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.owner = user_model.objects.create_user(
            username="owner",
            password="test-password",
        )
        self.claimer = user_model.objects.create_user(
            username="claimer",
            password="test-password",
        )
        self.other_user = user_model.objects.create_user(
            username="other-user",
            password="test-password",
        )

        self.location = Location.objects.create(
            alamat="Semarang",
            latitude=Decimal("-6.966667"),
            longitude=Decimal("110.416664"),
        )
        self.store = Store.objects.create(
            owner=self.owner,
            nama_toko="Toko Test",
            kontak_wa="081234567890",
            lokasi=self.location,
        )

    def create_item(self, **overrides):
        data = {
            "store": self.store,
            "name": "Ampas Kopi",
            "condition": Item.Condition.BYPRODUCT,
            "quantity_total": Decimal("10.00"),
            "quantity_remaining": Decimal("10.00"),
            "unit": "kg",
            "description": "Ampas kopi untuk kompos.",
            "category": "Ampas Kopi",
            "status": Item.Status.TERSEDIA,
        }
        data.update(overrides)
        return Item.objects.create(**data)

    def test_byproduct_listing_type_is_cleared(self):
        serializer = ItemSerializer(
            data={
                "name": "Ampas Kopi",
                "condition": Item.Condition.BYPRODUCT,
                "listing_type": Item.ListingType.DISKON,
                "quantity_total": "5.00",
                "unit": "kg",
                "description": "Byproduct.",
                "category": "Ampas Kopi",
            }
        )

        serializer.is_valid(raise_exception=True)

        self.assertIsNone(
            serializer.validated_data["listing_type"],
        )

    def test_authenticated_user_can_claim_available_item(self):
        item = self.create_item()
        self.client.force_authenticate(user=self.claimer)

        response = self.client.post(
            reverse(
                "item-checkout",
                kwargs={"pk": item.pk},
            ),
            {"jumlah": "2.50"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        item.refresh_from_db()
        claim = Klaim.objects.get(item=item)

        self.assertEqual(
            item.quantity_remaining,
            Decimal("7.50"),
        )
        self.assertEqual(
            item.status,
            Item.Status.TERSEDIA,
        )
        self.assertEqual(
            claim.jumlah_diklaim,
            Decimal("2.50"),
        )
        self.assertEqual(
            claim.status,
            Klaim.StatusKlaim.MENUNGGU,
        )

    def test_invalid_claim_quantities_are_rejected(self):
        item = self.create_item()
        self.client.force_authenticate(user=self.claimer)
        url = reverse(
            "item-checkout",
            kwargs={"pk": item.pk},
        )

        zero_response = self.client.post(
            url,
            {"jumlah": "0"},
            format="json",
        )
        excessive_response = self.client.post(
            url,
            {"jumlah": "11.00"},
            format="json",
        )

        self.assertEqual(
            zero_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            excessive_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        item.refresh_from_db()
        self.assertEqual(
            item.quantity_remaining,
            Decimal("10.00"),
        )
        self.assertFalse(
            Klaim.objects.filter(item=item).exists(),
        )

    def test_unavailable_item_statuses_cannot_be_claimed(self):
        self.client.force_authenticate(user=self.claimer)

        unavailable_statuses = [
            Item.Status.HABIS,
            Item.Status.SELESAI,
            Item.Status.KADALUARSA,
        ]

        for item_status in unavailable_statuses:
            with self.subTest(item_status=item_status):
                item = self.create_item(
                    name=f"Item {item_status}",
                    status=item_status,
                )

                response = self.client.post(
                    reverse(
                        "item-checkout",
                        kwargs={"pk": item.pk},
                    ),
                    {"jumlah": "1.00"},
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                )
                self.assertFalse(
                    Klaim.objects.filter(item=item).exists(),
                )

    def test_only_item_owner_can_complete_claim(self):
        item = self.create_item()
        claim = Klaim.objects.create(
            item=item,
            peminat=self.claimer,
            jumlah_diklaim=Decimal("2.00"),
        )
        url = reverse(
            "klaim-tandai-selesai",
            kwargs={"klaim_id": claim.pk},
        )

        self.client.force_authenticate(user=self.other_user)
        forbidden_response = self.client.patch(
            url,
            format="json",
        )

        self.assertEqual(
            forbidden_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(user=self.owner)
        success_response = self.client.patch(
            url,
            format="json",
        )

        self.assertEqual(
            success_response.status_code,
            status.HTTP_200_OK,
        )

        claim.refresh_from_db()
        self.assertEqual(
            claim.status,
            Klaim.StatusKlaim.SELESAI,
        )
        self.assertIsNotNone(claim.completed_at)

    def test_non_waiting_claim_cannot_be_completed(self):
        item = self.create_item()
        self.client.force_authenticate(user=self.owner)

        non_waiting_statuses = [
            Klaim.StatusKlaim.SELESAI,
            Klaim.StatusKlaim.BATAL,
        ]

        for claim_status in non_waiting_statuses:
            with self.subTest(claim_status=claim_status):
                claim = Klaim.objects.create(
                    item=item,
                    peminat=self.claimer,
                    jumlah_diklaim=Decimal("1.00"),
                    status=claim_status,
                )

                response = self.client.patch(
                    reverse(
                        "klaim-tandai-selesai",
                        kwargs={"klaim_id": claim.pk},
                    ),
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                )

                claim.refresh_from_db()
                self.assertEqual(
                    claim.status,
                    claim_status,
                )

    def test_item_detail_exposes_report_status(self):
        item = self.create_item()

        response = self.client.get(
            reverse("item-detail", kwargs={"pk": item.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_reported"])

    def test_report_item_requires_authentication(self):
        item = self.create_item()

        response = self.client.post(
            reverse("item-report", kwargs={"pk": item.pk})
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )
        item.refresh_from_db()
        self.assertFalse(item.is_reported)

    def test_user_can_report_item_idempotently(self):
        item = self.create_item()
        self.client.force_authenticate(user=self.other_user)
        report_url = reverse(
            "item-report",
            kwargs={"pk": item.pk},
        )

        first_response = self.client.post(report_url)
        second_response = self.client.post(report_url)

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK,
        )

        item.refresh_from_db()
        self.assertTrue(item.is_reported)

    def test_owner_cannot_report_own_item(self):
        item = self.create_item()
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            reverse("item-report", kwargs={"pk": item.pk})
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        item.refresh_from_db()
        self.assertFalse(item.is_reported)

class StoreAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(username="toko-owner", password="test-password")
        self.other_user = user_model.objects.create_user(username="other-user", password="test-password")

        self.store = Store.objects.create(
            owner=self.owner,
            nama_toko="Toko Berkah",
            kontak_wa="081234567890",
        )

    def test_store_list_is_public(self):
        response = self.client.get(reverse("store-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_store_list_filters_by_owner(self):
        response = self.client.get(reverse("store-list-create"), {"owner": self.other_user.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_store_requires_auth(self):
        response = self.client.post(
            reverse("store-list-create"),
            {"nama_toko": "Toko Baru", "kontak_wa": "081200000000"},
        )

        # 401, not 403 - TokenAuthentication is configured project-wide now,
        # so DRF challenges the request instead of just forbidding it
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_store(self):
        self.client.force_authenticate(self.other_user)

        response = self.client.post(
            reverse("store-list-create"),
            {"nama_toko": "Toko Baru", "kontak_wa": "081200000000"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Store.objects.count(), 2)

    def test_user_cannot_create_a_second_store(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse("store-list-create"),
            {"nama_toko": "Toko Kedua", "kontak_wa": "081200000000"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Store.objects.count(), 1)

    def test_owner_can_update_own_store(self):
        self.client.force_authenticate(self.owner)

        response = self.client.patch(
            reverse("store-detail", kwargs={"pk": self.store.pk}),
            {"description": "Toko sayur dan buah segar"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.store.refresh_from_db()
        self.assertEqual(self.store.description, "Toko sayur dan buah segar")

    def test_non_owner_cannot_update_store(self):
        self.client.force_authenticate(self.other_user)

        response = self.client.patch(
            reverse("store-detail", kwargs={"pk": self.store.pk}),
            {"description": "Diubah paksa"},
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.store.refresh_from_db()
        self.assertEqual(self.store.description, "")

    def test_store_detail_is_public(self):
        response = self.client.get(reverse("store-detail", kwargs={"pk": self.store.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nama_toko"], "Toko Berkah")
