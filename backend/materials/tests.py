from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from items.models import Item, Klaim, Store
from locations.models import Location


class MaterialReadAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="material-owner",
            password="test-password",
        )
        self.location = Location.objects.create(
            alamat="Semarang",
            latitude=Decimal("-6.966667"),
            longitude=Decimal("110.416664"),
        )
        self.store = Store.objects.create(
            owner=self.owner,
            nama_toko="Toko Material",
            kontak_wa="081234567890",
            lokasi=self.location,
        )
        self.material = self.create_item(
            name="Ampas Kopi",
            condition=Item.Condition.BYPRODUCT,
            category="Ampas Kopi",
        )
        self.food = self.create_item(
            name="Roti",
            condition=Item.Condition.LAYAK_MAKAN,
            category="Makanan",
            listing_type=Item.ListingType.DONASI,
        )

    def create_item(self, **overrides):
        data = {
            "store": self.store,
            "name": "Material Test",
            "condition": Item.Condition.BYPRODUCT,
            "quantity_total": Decimal("10.00"),
            "quantity_remaining": Decimal("10.00"),
            "unit": "kg",
            "description": "Material untuk digunakan kembali.",
            "category": "Material",
            "status": Item.Status.TERSEDIA,
        }
        data.update(overrides)
        return Item.objects.create(**data)

    def test_list_only_returns_byproducts(self):
        response = self.client.get(reverse("material-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {self.material.id})

    def test_material_detail_contains_required_information(self):
        response = self.client.get(
            reverse("material-detail", kwargs={"pk": self.material.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Ampas Kopi")
        self.assertEqual(response.data["poster_name"], "material-owner")
        self.assertEqual(response.data["store_name"], "Toko Material")
        self.assertEqual(
            response.data["pickup_location"]["alamat"],
            "Semarang",
        )

    def test_non_byproduct_detail_returns_not_found(self):
        response = self.client.get(
            reverse("material-detail", kwargs={"pk": self.food.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_supports_search_category_and_status_filters(self):
        matching_material = self.create_item(
            name="Kulit Jeruk",
            category="Kulit Buah",
            status=Item.Status.TERSEDIA_SEBAGIAN,
        )

        response = self.client.get(
            reverse("material-list"),
            {
                "search": "jeruk",
                "category": "Kulit Buah",
                "status": Item.Status.TERSEDIA_SEBAGIAN,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {matching_material.id})

    def test_management_requires_authentication(self):
        response = self.client.get(
            reverse("material-management-list")
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_management_only_returns_owned_materials_with_claims(self):
        user_model = get_user_model()
        claimer = user_model.objects.create_user(
            username="material-claimer",
            password="test-password",
        )
        other_owner = user_model.objects.create_user(
            username="other-material-owner",
            password="test-password",
        )
        other_store = Store.objects.create(
            owner=other_owner,
            nama_toko="Toko Lain",
            kontak_wa="089876543210",
            lokasi=self.location,
        )
        other_material = self.create_item(
            store=other_store,
            name="Material Milik User Lain",
        )
        claim = Klaim.objects.create(
            item=self.material,
            peminat=claimer,
            jumlah_diklaim=Decimal("2.00"),
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            reverse("material-management-list")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {self.material.id})
        self.assertNotIn(other_material.id, returned_ids)

        returned_claim = response.data[0]["claims"][0]
        self.assertEqual(returned_claim["id"], claim.id)
        self.assertEqual(
            returned_claim["peminat_nama"],
            "material-claimer",
        )
        self.assertEqual(
            returned_claim["jumlah_diklaim"],
            "2.00",
        )

    def test_report_requires_authentication(self):
        response = self.client.post(
            reverse(
                "material-report",
                kwargs={"pk": self.material.pk},
            )
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )
        self.material.refresh_from_db()
        self.assertFalse(self.material.is_reported)

    def test_user_can_report_material_idempotently(self):
        user_model = get_user_model()
        reporter = user_model.objects.create_user(
            username="material-reporter",
            password="test-password",
        )
        self.client.force_authenticate(user=reporter)
        report_url = reverse(
            "material-report",
            kwargs={"pk": self.material.pk},
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

        self.material.refresh_from_db()
        self.assertTrue(self.material.is_reported)

        detail_response = self.client.get(
            reverse(
                "material-detail",
                kwargs={"pk": self.material.pk},
            )
        )
        self.assertTrue(detail_response.data["is_reported"])

    def test_owner_cannot_report_own_material(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            reverse(
                "material-report",
                kwargs={"pk": self.material.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.material.refresh_from_db()
        self.assertFalse(self.material.is_reported)

    def test_non_byproduct_cannot_be_reported_through_material_api(self):
        user_model = get_user_model()
        reporter = user_model.objects.create_user(
            username="food-reporter",
            password="test-password",
        )
        self.client.force_authenticate(user=reporter)

        response = self.client.post(
            reverse(
                "material-report",
                kwargs={"pk": self.food.pk},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.food.refresh_from_db()
        self.assertFalse(self.food.is_reported)
