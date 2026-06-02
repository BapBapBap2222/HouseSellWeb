from rest_framework import serializers

from utils.supabase_storage import build_media_url

from .models import Favorite, Property, PropertyImage


PROPERTY_TYPE_LABELS = {
    "house": "House",
    "apartment": "Apartment",
    "land": "Land",
    "villa": "Villa",
    "other": "Other",
}

LISTING_TYPE_LABELS = {
    "sale": "For Sale",
    "rent": "For Rent",
}

STATUS_LABELS = {
    "active": "Active",
    "inactive": "Inactive",
    "sold": "Sold",
    "rented": "Rented",
}


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "caption", "is_primary", "order"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image"] = build_media_url(instance.image, self.context.get("request"))
        return data


class PropertyListSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    owner_phone = serializers.SerializerMethodField()
    owner_agent_slug = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    listing_type_display = serializers.SerializerMethodField()
    property_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "property_type",
            "property_type_display",
            "listing_type",
            "listing_type_display",
            "status",
            "status_display",
            "price",
            "area",
            "bedrooms",
            "bathrooms",
            "city",
            "district",
            "ward",
            "address",
            "owner_name",
            "owner_phone",
            "owner_agent_slug",
            "primary_image",
            "views_count",
            "is_featured",
            "is_favorited",
            "is_active",
            "created_at",
        ]

    def get_primary_image(self, obj):
        images = list(obj.images.all())
        image = next((item for item in images if item.is_primary), None) or (images[0] if images else None)
        return build_media_url(image.image, self.context.get("request")) if image else None

    def get_owner_phone(self, obj):
        profile = getattr(obj.owner, "profile", None)
        return profile.phone if profile else None

    def get_owner_agent_slug(self, obj):
        agent = getattr(obj.owner, "agent_profile", None)
        return agent.slug if agent else None

    def get_listing_type_display(self, obj):
        return LISTING_TYPE_LABELS.get(obj.listing_type, obj.listing_type)

    def get_property_type_display(self, obj):
        return PROPERTY_TYPE_LABELS.get(obj.property_type, obj.property_type)

    def get_status_display(self, obj):
        return STATUS_LABELS.get(obj.status, obj.status)

    def get_is_favorited(self, obj):
        annotated_value = getattr(obj, "is_favorited_value", None)
        if annotated_value is not None:
            return bool(annotated_value)

        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, property=obj).exists()
        return False


class PropertyDetailSerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    owner_phone = serializers.SerializerMethodField()
    owner_agent_slug = serializers.SerializerMethodField()
    listing_type_display = serializers.SerializerMethodField()
    property_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = "__all__"

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, property=obj).exists()
        return False

    def get_owner_phone(self, obj):
        profile = getattr(obj.owner, "profile", None)
        return profile.phone if profile else None

    def get_owner_agent_slug(self, obj):
        agent = getattr(obj.owner, "agent_profile", None)
        return agent.slug if agent else None

    def get_listing_type_display(self, obj):
        return LISTING_TYPE_LABELS.get(obj.listing_type, obj.listing_type)

    def get_property_type_display(self, obj):
        return PROPERTY_TYPE_LABELS.get(obj.property_type, obj.property_type)

    def get_status_display(self, obj):
        return STATUS_LABELS.get(obj.status, obj.status)


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        exclude = ["owner", "views_count", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


class PropertyImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "caption", "is_primary", "order"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image"] = build_media_url(instance.image, self.context.get("request"))
        return data

    def create(self, validated_data):
        validated_data["property"] = self.context["property"]
        if validated_data.get("is_primary"):
            PropertyImage.objects.filter(
                property=self.context["property"],
                is_primary=True,
            ).update(is_primary=False)
        return super().create(validated_data)


class FavoriteSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_id = serializers.IntegerField(source="property.id", read_only=True)
    property = PropertyListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "property_id", "property_title", "property", "created_at"]
