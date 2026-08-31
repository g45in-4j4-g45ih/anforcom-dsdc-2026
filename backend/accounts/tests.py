from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class RegisterAPITests(APITestCase):
    def test_register_creates_user_and_returns_token(self):
        response = self.client.post(
            reverse("auth-register"),
            {"username": "newbie", "password": "S3curePass!23", "email": "newbie@example.com"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "newbie")

        user = get_user_model().objects.get(username="newbie")
        self.assertEqual(Token.objects.get(user=user).key, response.data["token"])

    def test_register_rejects_duplicate_username(self):
        get_user_model().objects.create_user(username="taken", password="S3curePass!23")

        response = self.client.post(
            reverse("auth-register"),
            {"username": "taken", "password": "AnotherPass!23"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_weak_password(self):
        response = self.client.post(
            reverse("auth-register"),
            {"username": "weakpass", "password": "123"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(get_user_model().objects.filter(username="weakpass").exists())

    def test_register_requires_username_and_password(self):
        response = self.client.post(reverse("auth-register"), {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="existing", password="S3curePass!23")

    def test_login_with_correct_credentials(self):
        response = self.client.post(
            reverse("auth-login"),
            {"username": "existing", "password": "S3curePass!23"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["token"], Token.objects.get(user=self.user).key)
        self.assertEqual(response.data["user"]["username"], "existing")

    def test_login_with_wrong_password(self):
        response = self.client.post(
            reverse("auth-login"),
            {"username": "existing", "password": "wrong-password"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_unknown_username(self):
        response = self.client.post(
            reverse("auth-login"),
            {"username": "ghost", "password": "whatever"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_requires_both_fields(self):
        response = self.client.post(reverse("auth-login"), {"username": "existing"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_authenticates_subsequent_requests(self):
        login_response = self.client.post(
            reverse("auth-login"),
            {"username": "existing", "password": "S3curePass!23"},
        )
        token = login_response.data["token"]

        response = self.client.post(
            reverse("item-list-create"),
            {},
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        # missing store, but proves the token was accepted (not a 401/403)
        self.assertNotIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
