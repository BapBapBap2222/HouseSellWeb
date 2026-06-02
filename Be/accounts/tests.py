import json

from accounts.models import UserProfile
from appointments.models import Appointment
from django.conf import settings
from django.contrib.admin.sites import site
from django.urls import reverse
from news.models import News
from properties.models import Favorite, Property, PropertyImage
from rest_framework import status
from rest_framework.test import APITestCase

from utils.factories import TestDataFactory


class AuthApiTests(APITestCase):
    def test_register_and_login_flow(self):
        register_payload = {
            "username": "new_user",
            "email": "new_user@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "Pass123!",
            "password_confirm": "Pass123!",
        }
        register_response = self.client.post(
            reverse("register"), register_payload, format="json"
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", register_response.data)
        self.assertIn("refresh", register_response.data)

        login_response = self.client.post(
            reverse("login"),
            {"username": "new_user", "password": "Pass123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("user", login_response.data)
        self.assertEqual(login_response.data["user"]["username"], "new_user")

    def test_change_password_requires_correct_old_password(self):
        user = TestDataFactory.create_user(password="Pass123!")
        login = self.client.post(
            reverse("login"),
            {"username": user.username, "password": "Pass123!"},
            format="json",
        )
        access_token = login.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.post(
            reverse("change-password"),
            {
                "old_password": "Pass123!",
                "new_password": "NewPass123!",
                "new_password_confirm": "NewPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class DeployReadinessApiTests(APITestCase):
    def test_admin_registry_covers_expected_models(self):
        self.assertIn(UserProfile, site._registry)
        self.assertIn(Property, site._registry)
        self.assertIn(PropertyImage, site._registry)
        self.assertIn(Favorite, site._registry)
        self.assertIn(Appointment, site._registry)
        self.assertIn(News, site._registry)

    def test_swagger_json_exposes_core_endpoints(self):
        schema_url = reverse("schema-json", kwargs={"format": ".json"})
        response = self.client.get(schema_url)

        if not settings.SWAGGER_PUBLIC:
            self.assertIn(
                response.status_code,
                (
                    status.HTTP_401_UNAUTHORIZED,
                    status.HTTP_403_FORBIDDEN,
                    status.HTTP_302_FOUND,
                ),
            )
            return

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        schema = json.loads(response.content.decode("utf-8"))
        paths = schema.get("paths", {})
        expected_suffixes = [
            "/auth/login/",
            "/properties/",
            "/appointments/",
            "/news/",
            "/prediction/",
        ]
        for suffix in expected_suffixes:
            self.assertTrue(
                suffix in paths or f"/api{suffix}" in paths,
                f"Swagger schema missing endpoint suffix: {suffix}",
            )
