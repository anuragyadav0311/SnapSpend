from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.oauth import build_oauth_handoff_token
from apps.accounts.serializers import CustomTokenObtainPairSerializer


User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            name="Existing User",
            email="existing@example.com",
            password="SecurePass@123",
        )
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.refresh_url = reverse("token-refresh")
        self.me_url = reverse("me")
        self.change_password_url = reverse("change-password")
        self.logout_url = reverse("logout")
        self.oauth_complete_url = reverse("oauth-complete")

    def authenticate(self, email="existing@example.com", password="SecurePass@123"):
        response = self.client.post(
            self.login_url,
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response.data

    def test_register_creates_user(self):
        response = self.client.post(
            self.register_url,
            {
                "name": "New User",
                "email": "new@example.com",
                "password": "StrongPass@123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="new@example.com").exists())

    def test_register_rejects_duplicate_email(self):
        response = self.client.post(
            self.register_url,
            {
                "name": "Duplicate User",
                "email": "existing@example.com",
                "password": "StrongPass@123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_returns_access_and_refresh_tokens(self):
        response = self.client.post(
            self.login_url,
            {"email": "existing@example.com", "password": "SecurePass@123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me_requires_authentication(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_user(self):
        self.authenticate()
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user.email)
        self.assertEqual(response.data["name"], self.user.name)

    def test_profile_update_changes_name_and_email(self):
        self.authenticate()
        response = self.client.put(
            self.me_url,
            {"name": "Updated Name", "email": "updated@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "Updated Name")
        self.assertEqual(self.user.email, "updated@example.com")

    def test_change_password_requires_correct_current_password(self):
        self.authenticate()
        response = self.client.put(
            self.change_password_url,
            {
                "current_password": "wrong-password",
                "new_password": "NewSecurePass@123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)

    def test_change_password_updates_credentials(self):
        self.authenticate()
        response = self.client.put(
            self.change_password_url,
            {
                "current_password": "SecurePass@123",
                "new_password": "NewSecurePass@123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePass@123"))

    def test_refresh_returns_new_access_token(self):
        tokens = self.authenticate()
        self.client.credentials()
        response = self.client.post(
            self.refresh_url,
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_logout_blacklists_refresh_token(self):
        tokens = self.authenticate()
        response = self.client.post(
            self.logout_url,
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        refresh_response = self.client.post(
            self.refresh_url,
            {"refresh": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_refresh_token(self):
        self.authenticate()
        response = self.client.post(self.logout_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Refresh token is required.")

    @override_settings(
        GOOGLE_OAUTH_CLIENT_ID="google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET="google-client-secret",
        GOOGLE_OAUTH_REDIRECT_URI="http://localhost:8000/api/auth/oauth/google/callback/",
    )
    def test_google_oauth_start_returns_authorization_url(self):
        response = self.client.post(reverse("oauth-start", kwargs={"provider": "google"}), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("authorization_url", response.data)
        self.assertIn("accounts.google.com", response.data["authorization_url"])

    def test_oauth_complete_returns_tokens_and_user(self):
        handoff_token = build_oauth_handoff_token(self.user.id)
        response = self.client.post(
            self.oauth_complete_url,
            {"token": handoff_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    @patch("apps.accounts.views.authenticate_provider_callback")
    def test_oauth_callback_redirects_to_frontend_handoff(self, authenticate_provider_callback):
        authenticate_provider_callback.return_value = self.user
        response = self.client.get(
            reverse("oauth-callback", kwargs={"provider": "google"}),
            {"code": "sample-code", "state": "sample-state"},
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("/auth/callback?token=", response.url)


class AccountsTokenClaimTests(APITestCase):
    def test_custom_token_contains_name_and_email_claims(self):
        user = User.objects.create_user(
            name="Claims User",
            email="claims@example.com",
            password="SecurePass@123",
        )

        refresh = CustomTokenObtainPairSerializer.get_token(user)

        self.assertEqual(refresh["email"], "claims@example.com")
        self.assertEqual(refresh["name"], "Claims User")
