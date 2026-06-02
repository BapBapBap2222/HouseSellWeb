from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from agents.models import AgentReview
from utils.factories import TestDataFactory


class AgentVisibilityApiTests(APITestCase):
    def test_private_profile_is_hidden_from_public_agent_list_and_detail(self):
        public_user = TestDataFactory.create_user()
        public_user.profile.profile_visible = True
        public_user.profile.save(update_fields=["profile_visible"])
        public_user.agent_profile.is_verified = True
        public_user.agent_profile.save(update_fields=["is_verified", "updated_at"])

        private_user = TestDataFactory.create_user()
        private_user.profile.profile_visible = False
        private_user.profile.save(update_fields=["profile_visible"])
        private_user.agent_profile.is_verified = True
        private_user.agent_profile.save(update_fields=["is_verified", "updated_at"])

        list_response = self.client.get(reverse("agent-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        returned_slugs = {item["slug"] for item in list_response.data["results"]}
        self.assertIn(public_user.agent_profile.slug, returned_slugs)
        self.assertNotIn(private_user.agent_profile.slug, returned_slugs)

        detail_response = self.client.get(reverse("agent-detail", kwargs={"slug": private_user.agent_profile.slug}))
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_agent_list_is_limited_to_20_profiles_per_payload(self):
        for _ in range(25):
            user = TestDataFactory.create_user()
            user.profile.profile_visible = True
            user.profile.save(update_fields=["profile_visible"])

        response = self.client.get(reverse("agent-list"), {"page_size": 50})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 20)

    def test_agent_list_reuses_prefetched_properties_for_area_names(self):
        user = TestDataFactory.create_user()
        user.first_name = "Prefetched"
        user.last_name = "Areas"
        user.save(update_fields=["first_name", "last_name"])
        user.profile.profile_visible = True
        user.profile.save(update_fields=["profile_visible"])
        TestDataFactory.create_property(owner=user, city="Da Nang")
        TestDataFactory.create_property(owner=user, city="Hue")

        response = self.client.get(reverse("agent-list"), {"search": "Prefetched Areas", "page_size": 1})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["areas"], ["Hue", "Da Nang"])

    def test_authenticated_user_can_rate_agent_and_update_existing_review(self):
        agent_user = TestDataFactory.create_user()
        agent_user.profile.profile_visible = True
        agent_user.profile.save(update_fields=["profile_visible"])
        agent_user.agent_profile.is_verified = True
        agent_user.agent_profile.save(update_fields=["is_verified", "updated_at"])
        reviewer = TestDataFactory.create_user()
        url = reverse("agent-reviews", kwargs={"slug": agent_user.agent_profile.slug})

        self.client.force_authenticate(user=reviewer)
        created = self.client.post(url, {"rating": 5, "comment": "Great support"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        agent_user.agent_profile.refresh_from_db()
        self.assertEqual(agent_user.agent_profile.total_reviews, 1)
        self.assertEqual(str(agent_user.agent_profile.rating), "5.00")

        updated = self.client.post(url, {"rating": 4, "comment": "Updated after second visit"}, format="json")
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(AgentReview.objects.filter(agent=agent_user.agent_profile, reviewer=reviewer).count(), 1)
        agent_user.agent_profile.refresh_from_db()
        self.assertEqual(agent_user.agent_profile.total_reviews, 1)
        self.assertEqual(str(agent_user.agent_profile.rating), "4.00")

    def test_user_cannot_rate_own_agent_profile(self):
        agent_user = TestDataFactory.create_user()
        agent_user.profile.profile_visible = True
        agent_user.profile.save(update_fields=["profile_visible"])
        agent_user.agent_profile.is_verified = True
        agent_user.agent_profile.save(update_fields=["is_verified", "updated_at"])
        self.client.force_authenticate(user=agent_user)

        response = self.client.post(
            reverse("agent-reviews", kwargs={"slug": agent_user.agent_profile.slug}),
            {"rating": 5, "comment": "Self rating"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
