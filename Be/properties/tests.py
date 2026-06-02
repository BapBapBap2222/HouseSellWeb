from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from utils.factories import TestDataFactory


class PropertyApiTests(APITestCase):
    def setUp(self):
        self.owner = TestDataFactory.create_user()
        self.other_user = TestDataFactory.create_user()
        self.active_property = TestDataFactory.create_property(owner=self.owner, is_active=True)
        self.inactive_property = TestDataFactory.create_property(owner=self.owner, is_active=False)

    @staticmethod
    def _list_results(response):
        return response.data["results"] if isinstance(response.data, dict) else response.data

    @staticmethod
    def _gif_file(name: str = "test.gif", content: bytes | None = None):
        return SimpleUploadedFile(
            name,
            content
            or (
                b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
                b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00"
                b"\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
            ),
            content_type="image/gif",
        )

    def test_list_only_returns_active_properties(self):
        response = self.client.get(reverse("property-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in self._list_results(response)}
        self.assertIn(self.active_property.id, returned_ids)
        self.assertNotIn(self.inactive_property.id, returned_ids)

    def test_list_is_paginated_by_default(self):
        for idx in range(30):
            TestDataFactory.create_property(owner=self.owner, title=f"Paged property {idx}")

        response = self.client.get(reverse("property-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 31)
        self.assertEqual(len(response.data["results"]), 24)
        self.assertIsNotNone(response.data["next"])

    def test_list_filters_multiple_property_types_and_hcm_number_district(self):
        apartment = TestDataFactory.create_property(
            owner=self.owner,
            property_type="apartment",
            city="Ho Chi Minh City",
            district="1",
        )
        land = TestDataFactory.create_property(
            owner=self.owner,
            property_type="land",
            city="Ho Chi Minh City",
            district="7",
        )

        response = self.client.get(
            reverse("property-list-create"),
            {
                "property_types": "apartment,land",
                "city": "Hồ Chí Minh",
                "district": "Quận 1",
                "page_size": 10,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in self._list_results(response)}
        self.assertIn(apartment.id, returned_ids)
        self.assertNotIn(land.id, returned_ids)

    def test_list_can_order_featured_properties_first_for_homepage(self):
        featured = TestDataFactory.create_property(
            owner=self.owner,
            title="Featured homepage listing",
            is_featured=True,
        )

        response = self.client.get(
            reverse("property-list-create"),
            {"ordering": "-is_featured,-created_at", "page_size": 5},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._list_results(response)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["id"], featured.id)

    def test_non_owner_cannot_update_property(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            reverse("property-detail", kwargs={"pk": self.active_property.id}),
            {"title": "Hacked title"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_update_property(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            reverse("property-detail", kwargs={"pk": self.active_property.id}),
            {"title": "Updated title"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated title")

    def test_owner_can_mark_property_sold_and_hidden(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            reverse("property-detail", kwargs={"pk": self.active_property.id}),
            {"status": "sold", "is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "sold")
        self.assertFalse(response.data["is_active"])

        detail = self.client.get(reverse("property-detail", kwargs={"pk": self.active_property.id}))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["status"], "sold")

    def test_non_owner_cannot_delete_property(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(reverse("property-detail", kwargs={"pk": self.active_property.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_favorite_add_then_remove(self):
        self.client.force_authenticate(user=self.other_user)
        toggle_url = reverse("favorite-toggle", kwargs={"pk": self.active_property.id})

        added = self.client.post(toggle_url, format="json")
        self.assertEqual(added.status_code, status.HTTP_201_CREATED)
        self.assertTrue(added.data["is_favorited"])

        removed = self.client.post(toggle_url, format="json")
        self.assertEqual(removed.status_code, status.HTTP_200_OK)
        self.assertFalse(removed.data["is_favorited"])

    def test_property_list_marks_authenticated_user_favorites(self):
        self.client.force_authenticate(user=self.other_user)
        self.client.post(reverse("favorite-toggle", kwargs={"pk": self.active_property.id}), format="json")

        response = self.client.get(reverse("property-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        active_item = next(item for item in self._list_results(response) if item["id"] == self.active_property.id)
        self.assertTrue(active_item["is_favorited"])

    def test_favorite_list_returns_renderable_property_data(self):
        self.client.force_authenticate(user=self.other_user)
        self.client.post(reverse("favorite-toggle", kwargs={"pk": self.active_property.id}), format="json")

        response = self.client.get(reverse("favorite-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        favorite = response.data[0]
        self.assertEqual(favorite["property_id"], self.active_property.id)
        self.assertEqual(favorite["property"]["id"], self.active_property.id)
        self.assertTrue(favorite["property"]["is_favorited"])

    def test_owner_can_upload_property_image(self):
        self.client.force_authenticate(user=self.owner)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})
        image_file = self._gif_file()
        response = self.client.post(
            upload_url,
            {"images": [image_file], "is_primary": "true", "caption": "Main image"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(response.data[0]["is_primary"])

    def test_non_owner_cannot_upload_property_image(self):
        self.client.force_authenticate(user=self.other_user)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})

        response = self.client.post(
            upload_url,
            {"images": [self._gif_file()], "caption": "Not my property"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_upload_rejects_invalid_content_type(self):
        self.client.force_authenticate(user=self.owner)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})
        txt_file = SimpleUploadedFile("bad.txt", b"hello", content_type="text/plain")

        response = self.client.post(upload_url, {"images": [txt_file], "caption": "Invalid file"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("images", response.data)

    @override_settings(PROPERTY_IMAGE_MAX_UPLOAD_BYTES=20)
    def test_upload_rejects_oversized_file(self):
        self.client.force_authenticate(user=self.owner)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})
        big_content = b"GIF87a" + (b"x" * 200)

        response = self.client.post(
            upload_url,
            {"images": [self._gif_file(name="big.gif", content=big_content)], "caption": "Too large"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("images", response.data)

    @override_settings(PROPERTY_IMAGE_MAX_FILES_PER_UPLOAD=1)
    def test_upload_rejects_too_many_files_in_single_request(self):
        self.client.force_authenticate(user=self.owner)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})

        response = self.client.post(
            upload_url,
            {"images": [self._gif_file(name="a.gif"), self._gif_file(name="b.gif")], "caption": "Too many"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("images", response.data)

    @override_settings(PROPERTY_IMAGE_MAX_FILES_PER_PROPERTY=1)
    def test_upload_rejects_if_total_images_exceed_property_limit(self):
        self.client.force_authenticate(user=self.owner)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})
        first = self.client.post(
            upload_url,
            {"images": [self._gif_file(name="first.gif")], "caption": "First"},
            format="multipart",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(
            upload_url,
            {"images": [self._gif_file(name="second.gif")], "caption": "Second"},
            format="multipart",
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("images", second.data)

    def test_delete_primary_image_promotes_next_image(self):
        self.client.force_authenticate(user=self.owner)
        upload_url = reverse("property-image-upload", kwargs={"pk": self.active_property.id})

        first = self.client.post(
            upload_url,
            {"images": [self._gif_file(name="first.gif")], "is_primary": "true", "order": 0, "caption": "First"},
            format="multipart",
        )
        second = self.client.post(
            upload_url,
            {"images": [self._gif_file(name="second.gif")], "is_primary": "false", "order": 1, "caption": "Second"},
            format="multipart",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)

        delete_url = reverse("property-image-delete", kwargs={"pk": first.data[0]["id"]})
        deleted = self.client.delete(delete_url)
        self.assertEqual(deleted.status_code, status.HTTP_200_OK)

        detail = self.client.get(reverse("property-detail", kwargs={"pk": self.active_property.id}))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertTrue(len(detail.data["images"]) == 1)
        self.assertTrue(detail.data["images"][0]["is_primary"])
