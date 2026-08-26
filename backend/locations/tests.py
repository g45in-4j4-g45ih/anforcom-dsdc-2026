from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Location


class LocationCreateAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username="creator", password="test-password")

    def test_create_location_requires_auth(self):
        response = self.client.post(
            reverse("location-create"),
            {"alamat": "Jl. Pandanaran, Semarang", "latitude": "-6.9833", "longitude": "110.4167"},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_create_location(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("location-create"),
            {"alamat": "Jl. Pandanaran, Semarang", "latitude": "-6.9833", "longitude": "110.4167"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Location.objects.count(), 1)

    def test_create_location_without_coordinates(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("location-create"),
            {"alamat": "Jl. Pandanaran, Semarang"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        location = Location.objects.get()
        self.assertIsNone(location.latitude)

    def test_create_location_requires_alamat(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse("location-create"), {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
