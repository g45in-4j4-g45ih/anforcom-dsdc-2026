from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from items.models import Item, Klaim, Store


class ImpactAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="impact-owner",
            password="test-password",
        )
        self.claimer = user_model.objects.create_user(
            username="impact-claimer",
            password="test-password",
        )
        self.store = Store.objects.create(
            owner=self.owner,
            nama_toko="Toko Impact",
            kontak_wa="081234567890",
        )

    def create_item(self, **overrides):
        data = {
            "store": self.store,
            "name": "Item Impact",
            "condition": Item.Condition.LAYAK_MAKAN,
            "listing_type": Item.ListingType.DONASI,
            "quantity_total": Decimal("10.00"),
            "quantity_remaining": Decimal("5.00"),
            "unit": "kg",
            "description": "Item untuk pengujian impact.",
            "category": "Lainnya",
            "status": Item.Status.TERSEDIA_SEBAGIAN,
        }
        data.update(overrides)
        return Item.objects.create(**data)

    def create_claim(
        self,
        item,
        quantity,
        claim_status,
        claimer=None,
    ):
        completed_at = (
            timezone.now()
            if claim_status == Klaim.StatusKlaim.SELESAI
            else None
        )
        return Klaim.objects.create(
            item=item,
            peminat=claimer or self.claimer,
            jumlah_diklaim=Decimal(quantity),
            status=claim_status,
            completed_at=completed_at,
        )

    def seed_completed_claims(self):
        discount_item = self.create_item(
            name="Roti Diskon",
            listing_type=Item.ListingType.DISKON,
            unit="kg",
            category="Roti",
        )
        donation_item = self.create_item(
            name="Minuman Donasi",
            listing_type=Item.ListingType.DONASI,
            unit="liter",
            category="Minuman",
        )
        material_item = self.create_item(
            name="Ampas Kopi",
            condition=Item.Condition.BYPRODUCT,
            listing_type=None,
            unit="kg",
            category="Ampas",
        )

        self.create_claim(
            discount_item,
            "2.50",
            Klaim.StatusKlaim.SELESAI,
        )
        self.create_claim(
            donation_item,
            "3.00",
            Klaim.StatusKlaim.SELESAI,
        )
        self.create_claim(
            material_item,
            "4.00",
            Klaim.StatusKlaim.SELESAI,
        )

    def test_dashboard_is_public_and_empty_without_completed_claims(self):
        response = self.client.get(reverse("impact-dashboard"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["totals"]["total_transactions"], 0)
        self.assertEqual(
            Decimal(str(response.data["totals"]["total_kg"])),
            Decimal("0"),
        )
        self.assertEqual(
            Decimal(str(response.data["totals"]["total_liter"])),
            Decimal("0"),
        )

    def test_dashboard_only_aggregates_completed_claims(self):
        self.seed_completed_claims()
        ignored_item = self.create_item(name="Belum Selesai")

        self.create_claim(
            ignored_item,
            "100.00",
            Klaim.StatusKlaim.MENUNGGU,
        )
        self.create_claim(
            ignored_item,
            "100.00",
            Klaim.StatusKlaim.BATAL,
        )

        response = self.client.get(reverse("impact-dashboard"))
        totals = response.data["totals"]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(totals["total_transactions"], 3)
        self.assertEqual(
            Decimal(str(totals["total_kg"])),
            Decimal("6.50"),
        )
        self.assertEqual(
            Decimal(str(totals["total_liter"])),
            Decimal("3.00"),
        )

    def test_dashboard_breaks_down_path_and_category(self):
        self.seed_completed_claims()

        response = self.client.get(reverse("impact-dashboard"))
        by_path = response.data["by_path"]

        self.assertEqual(
            by_path["jual_diskon"]["total_transactions"],
            1,
        )
        self.assertEqual(
            Decimal(str(by_path["jual_diskon"]["total_kg"])),
            Decimal("2.50"),
        )
        self.assertEqual(
            Decimal(str(by_path["donasi"]["total_liter"])),
            Decimal("3.00"),
        )
        self.assertEqual(
            Decimal(
                str(
                    by_path["material_exchange"]["total_kg"]
                )
            ),
            Decimal("4.00"),
        )

        categories = {
            row["category"]: row
            for row in response.data["by_category"]
        }
        self.assertEqual(set(categories), {"Ampas", "Minuman", "Roti"})
        self.assertEqual(
            categories["Ampas"]["total_transactions"],
            1,
        )

    def test_dashboard_does_not_duplicate_transactions(self):
        self.seed_completed_claims()

        first_response = self.client.get(reverse("impact-dashboard"))
        second_response = self.client.get(reverse("impact-dashboard"))

        self.assertEqual(first_response.data, second_response.data)
        self.assertEqual(
            second_response.data["totals"]["total_transactions"],
            3,
        )

    def test_my_impact_requires_authentication(self):
        response = self.client.get(reverse("my-impact"))

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_my_impact_returns_zero_state(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(reverse("my-impact"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["totals"]["total_transactions"], 0)
        self.assertEqual(
            response.data["by_role"]["poster"]["total_transactions"],
            0,
        )
        self.assertEqual(
            response.data["by_role"]["claimer"]["total_transactions"],
            0,
        )

    def test_my_impact_aggregates_poster_and_claimer_roles(self):
        user_model = get_user_model()
        other_owner = user_model.objects.create_user(
            username="impact-other-owner",
            password="test-password",
        )
        other_store = Store.objects.create(
            owner=other_owner,
            nama_toko="Toko Impact Lain",
            kontak_wa="089876543210",
        )

        poster_item = self.create_item(
            name="Kontribusi Poster",
            unit="kg",
            category="Makanan",
        )
        claimer_item = self.create_item(
            store=other_store,
            name="Kontribusi Claimer",
            unit="liter",
            category="Minuman",
        )
        unrelated_item = self.create_item(
            store=other_store,
            name="Transaksi Pengguna Lain",
            unit="kg",
        )

        self.create_claim(
            poster_item,
            "2.00",
            Klaim.StatusKlaim.SELESAI,
        )
        self.create_claim(
            claimer_item,
            "3.00",
            Klaim.StatusKlaim.SELESAI,
            claimer=self.owner,
        )
        self.create_claim(
            unrelated_item,
            "100.00",
            Klaim.StatusKlaim.SELESAI,
        )
        self.create_claim(
            poster_item,
            "100.00",
            Klaim.StatusKlaim.MENUNGGU,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(reverse("my-impact"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["totals"]["total_transactions"],
            2,
        )
        self.assertEqual(
            Decimal(str(response.data["totals"]["total_kg"])),
            Decimal("2.00"),
        )
        self.assertEqual(
            Decimal(str(response.data["totals"]["total_liter"])),
            Decimal("3.00"),
        )
        self.assertEqual(
            response.data["by_role"]["poster"]["total_transactions"],
            1,
        )
        self.assertEqual(
            response.data["by_role"]["claimer"]["total_transactions"],
            1,
        )

    def test_impact_history_requires_authentication(self):
        response = self.client.get(reverse("impact-history"))

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_impact_history_only_returns_completed_user_transactions(self):
        user_model = get_user_model()
        other_owner = user_model.objects.create_user(
            username="history-other-owner",
            password="test-password",
        )
        other_store = Store.objects.create(
            owner=other_owner,
            nama_toko="Toko History Lain",
            kontak_wa="087654321098",
        )

        poster_item = self.create_item(name="History Poster")
        claimer_item = self.create_item(
            store=other_store,
            name="History Claimer",
            unit="liter",
        )
        unrelated_item = self.create_item(
            store=other_store,
            name="History Pengguna Lain",
        )

        self.create_claim(
            poster_item,
            "2.00",
            Klaim.StatusKlaim.SELESAI,
        )
        self.create_claim(
            claimer_item,
            "3.00",
            Klaim.StatusKlaim.SELESAI,
            claimer=self.owner,
        )
        self.create_claim(
            unrelated_item,
            "100.00",
            Klaim.StatusKlaim.SELESAI,
        )
        self.create_claim(
            poster_item,
            "100.00",
            Klaim.StatusKlaim.MENUNGGU,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(reverse("impact-history"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

        results = {
            row["item"]["name"]: row
            for row in response.data["results"]
        }
        self.assertEqual(
            results["History Poster"]["roles"],
            ["poster"],
        )
        self.assertEqual(
            results["History Claimer"]["roles"],
            ["claimer"],
        )
        self.assertNotIn("History Pengguna Lain", results)

    def test_impact_history_filters_path_and_category(self):
        self.seed_completed_claims()
        self.client.force_authenticate(user=self.owner)

        path_response = self.client.get(
            reverse("impact-history"),
            {"path": "material_exchange"},
        )
        category_response = self.client.get(
            reverse("impact-history"),
            {"category": "minuman"},
        )

        self.assertEqual(path_response.status_code, status.HTTP_200_OK)
        self.assertEqual(path_response.data["count"], 1)
        self.assertEqual(
            path_response.data["results"][0]["path"],
            "material_exchange",
        )

        self.assertEqual(
            category_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(category_response.data["count"], 1)
        self.assertEqual(
            category_response.data["results"][0]["category"],
            "Minuman",
        )

    def test_impact_history_filters_period(self):
        old_item = self.create_item(name="History Lama")
        recent_item = self.create_item(name="History Baru")

        old_claim = self.create_claim(
            old_item,
            "1.00",
            Klaim.StatusKlaim.SELESAI,
        )
        recent_claim = self.create_claim(
            recent_item,
            "1.00",
            Klaim.StatusKlaim.SELESAI,
        )

        Klaim.objects.filter(pk=old_claim.pk).update(
            completed_at=timezone.now() - timedelta(days=30),
        )
        Klaim.objects.filter(pk=recent_claim.pk).update(
            completed_at=timezone.now() - timedelta(days=2),
        )

        today = timezone.localdate()
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            reverse("impact-history"),
            {
                "start_date": (
                    today - timedelta(days=7)
                ).isoformat(),
                "end_date": today.isoformat(),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["item"]["name"],
            "History Baru",
        )

    def test_impact_history_rejects_invalid_filters(self):
        self.client.force_authenticate(user=self.owner)

        invalid_path = self.client.get(
            reverse("impact-history"),
            {"path": "tidak_valid"},
        )
        reversed_period = self.client.get(
            reverse("impact-history"),
            {
                "start_date": "2026-08-20",
                "end_date": "2026-08-01",
            },
        )

        self.assertEqual(
            invalid_path.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            reversed_period.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
