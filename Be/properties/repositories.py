from django.db.models import BooleanField, Exists, F, OuterRef, Prefetch, Q, Value

from .models import Favorite, Property, PropertyImage


class PropertyRepository:
    """Centralized database access for property domain."""

    _image_prefetch = Prefetch(
        "images",
        queryset=PropertyImage.objects.order_by("order", "id"),
    )

    @staticmethod
    def _with_favorite_status(queryset, user):
        if user and user.is_authenticated:
            return queryset.annotate(
                is_favorited_value=Exists(
                    Favorite.objects.filter(user=user, property_id=OuterRef("pk"))
                )
            )
        return queryset.annotate(is_favorited_value=Value(False, output_field=BooleanField()))

    @staticmethod
    def get_available(user=None):
        queryset = (
            Property.objects.filter(is_active=True)
            .select_related("owner", "owner__profile", "owner__agent_profile")
            .prefetch_related(PropertyRepository._image_prefetch)
        )
        return PropertyRepository._with_favorite_status(queryset, user)

    @staticmethod
    def get_accessible_for_user(user):
        queryset = (
            Property.objects.select_related("owner", "owner__profile", "owner__agent_profile")
            .prefetch_related(PropertyRepository._image_prefetch)
        )
        if user and user.is_authenticated:
            return PropertyRepository._with_favorite_status(
                queryset.filter(Q(is_active=True) | Q(owner=user)),
                user,
            )
        return PropertyRepository._with_favorite_status(queryset.filter(is_active=True), user)

    @staticmethod
    def get_by_id(pk: int) -> Property:
        return PropertyRepository.get_available().get(pk=pk)

    @staticmethod
    def get_by_owner(user):
        queryset = (
            Property.objects.filter(owner=user)
            .select_related("owner", "owner__profile", "owner__agent_profile")
            .prefetch_related(PropertyRepository._image_prefetch)
        )
        return PropertyRepository._with_favorite_status(queryset, user)

    @staticmethod
    def get_owned_by_id(pk: int, user) -> Property:
        return (
            Property.objects.select_related("owner", "owner__profile", "owner__agent_profile")
            .prefetch_related(PropertyRepository._image_prefetch)
            .get(pk=pk, owner=user)
        )

    @staticmethod
    def create(owner, **validated_data) -> Property:
        return Property.objects.create(owner=owner, **validated_data)

    @staticmethod
    def save(instance: Property) -> Property:
        instance.save()
        return instance

    @staticmethod
    def increment_view(property_obj: Property) -> None:
        Property.objects.filter(pk=property_obj.pk).update(views_count=F("views_count") + 1)

    @staticmethod
    def get_favorites(user):
        return (
            Favorite.objects.filter(user=user)
            .select_related(
                "property",
                "property__owner",
                "property__owner__profile",
                "property__owner__agent_profile",
            )
            .prefetch_related(
                Prefetch(
                    "property__images",
                    queryset=PropertyImage.objects.order_by("order", "id"),
                )
            )
        )

    @staticmethod
    def get_or_create_favorite(user, property_obj: Property):
        return Favorite.objects.get_or_create(user=user, property=property_obj)

    @staticmethod
    def delete_favorite(favorite: Favorite) -> None:
        favorite.delete()

    @staticmethod
    def clear_primary_image(property_obj: Property) -> None:
        PropertyImage.objects.filter(property=property_obj, is_primary=True).update(is_primary=False)

    @staticmethod
    def create_image(
        *, property_obj: Property, image, caption: str = "", is_primary: bool = False, order: int = 0
    ) -> PropertyImage:
        return PropertyImage.objects.create(
            property=property_obj,
            image=image,
            caption=caption or "",
            is_primary=is_primary,
            order=order,
        )

    @staticmethod
    def get_owned_image(image_id: int, user) -> PropertyImage:
        return PropertyImage.objects.get(pk=image_id, property__owner=user)

    @staticmethod
    def count_images(property_obj: Property) -> int:
        return PropertyImage.objects.filter(property=property_obj).count()

    @staticmethod
    def has_primary_image(property_obj: Property) -> bool:
        return PropertyImage.objects.filter(property=property_obj, is_primary=True).exists()

    @staticmethod
    def get_first_image(property_obj: Property):
        return (
            PropertyImage.objects.filter(property=property_obj)
            .order_by("order", "id")
            .first()
        )

    @staticmethod
    def set_primary(image_obj: PropertyImage) -> None:
        PropertyImage.objects.filter(property=image_obj.property, is_primary=True).exclude(pk=image_obj.pk).update(
            is_primary=False
        )
        PropertyImage.objects.filter(pk=image_obj.pk).update(is_primary=True)
