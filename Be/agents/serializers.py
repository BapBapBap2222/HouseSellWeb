from rest_framework import serializers

from properties.models import Property
from utils.supabase_storage import build_media_url

from .models import Agent, AgentReview


LISTING_TYPE_LABELS = {
    "sale": "For Sale",
    "rent": "For Rent",
}


def get_visible_properties_for_agent(agent: Agent):
    if not agent.user_id:
        return Property.objects.none()

    return (
        Property.objects.filter(owner=agent.user, is_active=True)
        .prefetch_related("images")
        .order_by("-created_at")
    )


def get_agent_area_names(agent: Agent):
    if not agent.user_id:
        return (agent.areas or [])[:5]

    prefetched_properties = getattr(agent.user, "visible_agent_properties", None)
    properties = prefetched_properties if prefetched_properties is not None else get_visible_properties_for_agent(agent)
    cities = []

    for property_obj in properties:
        city = (property_obj.city or "").strip()
        if city and city not in cities:
            cities.append(city)
        if len(cities) >= 5:
            break

    return cities or (agent.areas or [])[:5]


def get_property_image_url(property_obj: Property, request):
    image = property_obj.images.filter(is_primary=True).first() or property_obj.images.first()
    if not image:
        return None
    return build_media_url(image.image, request)


class AgentListSerializer(serializers.ModelSerializer):
    areas = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            "id",
            "full_name",
            "slug",
            "avatar_url",
            "city",
            "specialization",
            "tagline",
            "years_experience",
            "total_listings",
            "deals_closed",
            "rating",
            "total_reviews",
            "is_verified",
            "response_time",
            "areas",
            "languages",
        ]

    def get_areas(self, agent: Agent):
        return get_agent_area_names(agent)


class AgentDetailSerializer(serializers.ModelSerializer):
    areas = serializers.SerializerMethodField()
    activity_visible = serializers.SerializerMethodField()
    latest_activities = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            "id",
            "full_name",
            "slug",
            "avatar_url",
            "email",
            "phone",
            "city",
            "specialization",
            "tagline",
            "years_experience",
            "total_listings",
            "deals_closed",
            "rating",
            "total_reviews",
            "is_verified",
            "response_time",
            "areas",
            "languages",
            "bio",
            "activity_visible",
            "latest_activities",
            "created_at",
            "updated_at",
        ]

    def get_areas(self, agent: Agent):
        return get_agent_area_names(agent)

    def get_activity_visible(self, agent: Agent):
        profile = getattr(agent.user, "profile", None) if agent.user_id else None
        return bool(profile.activity_visible) if profile else False

    def get_latest_activities(self, agent: Agent):
        profile = getattr(agent.user, "profile", None) if agent.user_id else None
        if not profile or not profile.activity_visible:
            return []

        request = self.context.get("request")
        activities = []
        for property_obj in get_visible_properties_for_agent(agent)[:2]:
            activities.append(
                {
                    "id": property_obj.id,
                    "title": property_obj.title,
                    "label": "New listing",
                    "listing_type": LISTING_TYPE_LABELS.get(property_obj.listing_type, property_obj.listing_type),
                    "address": ", ".join(
                        part for part in [property_obj.address, property_obj.district, property_obj.city] if part
                    ),
                    "created_at": property_obj.created_at,
                    "image": get_property_image_url(property_obj, request),
                }
            )
        return activities


class AgentReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    reviewer_username = serializers.CharField(source="reviewer.username", read_only=True)

    class Meta:
        model = AgentReview
        fields = [
            "id",
            "agent",
            "reviewer",
            "reviewer_name",
            "reviewer_username",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["agent", "reviewer", "reviewer_name", "reviewer_username", "created_at", "updated_at"]

    def get_reviewer_name(self, review: AgentReview):
        full_name = review.reviewer.get_full_name().strip()
        return full_name or review.reviewer.username

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        return (value or "").strip()
