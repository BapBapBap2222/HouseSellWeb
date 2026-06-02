from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwnerOrReadOnly

from .filters import PropertyFilter
from .pagination import OptionalPageNumberPagination
from .repositories import PropertyRepository
from .serializers import (
    FavoriteSerializer,
    PropertyCreateUpdateSerializer,
    PropertyDetailSerializer,
    PropertyImageUploadSerializer,
    PropertyListSerializer,
)
from .services import PropertyService


class PropertyListCreateView(generics.ListCreateAPIView):
    """
    GET  /properties/   -> public listing with filter/search
    POST /properties/   -> create property (auth required)
    """

    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    pagination_class = OptionalPageNumberPagination
    search_fields = ["title", "description", "city", "district", "address"]
    ordering_fields = ["price", "area", "created_at", "views_count", "is_featured"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return PropertyRepository.get_available(self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PropertyCreateUpdateSerializer
        return PropertyListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        property_obj = PropertyService.create_property(
            owner=request.user, validated_data=serializer.validated_data
        )
        output = PropertyDetailSerializer(property_obj, context={"request": request})
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /properties/<id>/  -> detail + increment views_count
    PUT    /properties/<id>/  -> full update (owner)
    PATCH  /properties/<id>/  -> partial update (owner)
    DELETE /properties/<id>/  -> delete (owner)
    """

    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        return PropertyRepository.get_accessible_for_user(self.request.user)

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return PropertyCreateUpdateSerializer
        return PropertyDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        PropertyService.track_view(instance)
        instance.refresh_from_db(fields=["views_count"])
        serializer = PropertyDetailSerializer(instance, context={"request": request})
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        updated = PropertyService.update_property(
            user=request.user,
            property_obj=instance,
            validated_data=serializer.validated_data,
        )
        output = PropertyDetailSerializer(updated, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        PropertyService.delete_property(user=request.user, property_obj=instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyPropertiesView(generics.ListAPIView):
    """GET /properties/my/ -> authenticated user's properties."""

    serializer_class = PropertyListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OptionalPageNumberPagination

    def get_queryset(self):
        return PropertyRepository.get_by_owner(self.request.user)


class PropertyImageUploadView(APIView):
    """POST /properties/<id>/images/ -> upload property images (owner only)."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        images = request.FILES.getlist("images")
        if not images and request.FILES.get("image"):
            images = [request.FILES["image"]]

        primary_flag = request.data.get("is_primary") in (True, "true", "True", "1")
        try:
            start_order = int(request.data.get("order", 0))
        except (TypeError, ValueError):
            start_order = 0

        uploaded = PropertyService.upload_images(
            user=request.user,
            property_id=pk,
            images=images,
            caption=request.data.get("caption", ""),
            is_primary=primary_flag,
            start_order=start_order,
        )
        serializer = PropertyImageUploadSerializer(uploaded, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PropertyImageDeleteView(APIView):
    """DELETE /properties/images/<id>/ -> delete property image (owner only)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        PropertyService.delete_image(user=request.user, image_id=pk)
        return Response({"message": "Image deleted successfully."}, status=status.HTTP_200_OK)


class FavoriteListView(generics.ListAPIView):
    """GET /properties/favorites/ -> current user's favorites."""

    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PropertyRepository.get_favorites(self.request.user)


class FavoriteToggleView(APIView):
    """POST /properties/<id>/favorite/ -> toggle favorite state."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        result = PropertyService.toggle_favorite(user=request.user, property_id=pk)
        status_code = status.HTTP_201_CREATED if result["is_favorited"] else status.HTTP_200_OK
        return Response(result, status=status_code)
