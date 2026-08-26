from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from items.models import Store
from .models import Rating


class RatingAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(username="owner", password="test-password")
        self.rater = user_model.objects.create_user(username="rater", password="test-password")
        self.other_rater = user_model.objects.create_user(username="other-rater", password="test-password")

        self.store = Store.objects.create(owner=self.owner, nama_toko="Toko Berkah", kontak_wa="081234567890")

    def test_rating_list_is_public(self):
        Rating.objects.create(store=self.store, rater=self.rater, score=5, comment="Mantap")

        response = self.client.get(reverse("rating-list-create"), {"store": self.store.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_rating_requires_auth(self):
        response = self.client.post(
            reverse("rating-list-create"),
            {"store": self.store.id, "score": 4, "comment": "Bagus"},
        )

        # 403, not 401 — no DEFAULT_AUTHENTICATION_CLASSES is configured project-wide yet,
        # so DRF has no scheme to challenge with and falls back to plain "forbidden"
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_rate_store(self):
        self.client.force_authenticate(self.rater)

        response = self.client.post(
            reverse("rating-list-create"),
            {"store": self.store.id, "score": 4, "comment": "Bagus"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.count(), 1)
        self.assertEqual(Rating.objects.first().rater, self.rater)

    def test_user_cannot_rate_same_store_twice(self):
        Rating.objects.create(store=self.store, rater=self.rater, score=5, comment="Mantap")
        self.client.force_authenticate(self.rater)

        response = self.client.post(
            reverse("rating-list-create"),
            {"store": self.store.id, "score": 3, "comment": "Coba lagi"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Rating.objects.count(), 1)

    def test_owner_cannot_rate_own_store(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse("rating-list-create"),
            {"store": self.store.id, "score": 5, "comment": "Toko sendiri"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Rating.objects.count(), 0)

    def test_score_out_of_range_is_rejected(self):
        self.client.force_authenticate(self.rater)

        response = self.client.post(
            reverse("rating-list-create"),
            {"store": self.store.id, "score": 9, "comment": "Ngasal"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Rating.objects.count(), 0)

    def test_user_can_only_edit_own_rating(self):
        rating = Rating.objects.create(store=self.store, rater=self.rater, score=5, comment="Mantap")
        self.client.force_authenticate(self.other_rater)

        response = self.client.patch(
            reverse("rating-detail", args=[rating.id]),
            {"comment": "Diubah paksa"},
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rating_summary_returns_average_and_count(self):
        Rating.objects.create(store=self.store, rater=self.rater, score=4)
        Rating.objects.create(store=self.store, rater=self.other_rater, score=2)

        response = self.client.get(reverse("store-rating-summary", args=[self.store.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average"], 3.0)
        self.assertEqual(response.data["count"], 2)

    def test_rating_summary_handles_store_with_no_ratings(self):
        response = self.client.get(reverse("store-rating-summary", args=[self.store.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["average"])
        self.assertEqual(response.data["count"], 0)

    def test_rating_summary_404s_for_unknown_store(self):
        response = self.client.get(reverse("store-rating-summary", args=[9999]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
