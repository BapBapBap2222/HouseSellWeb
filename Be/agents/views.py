from django.db.models import Q
from rest_framework import filters, generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Agent, AgentReview
from .serializers import AgentDetailSerializer, AgentListSerializer, AgentReviewSerializer


class AgentListView(generics.ListAPIView):
    serializer_class = AgentListSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["full_name", "specialization", "city", "tagline", "bio"]

    def get_queryset(self):
        return (
            Agent.objects.exclude(Q(user__is_staff=True) | Q(user__is_superuser=True))
            .filter(Q(user__isnull=True) | Q(user__profile__profile_visible=True))
        )


class AgentDetailView(generics.RetrieveAPIView):
    serializer_class = AgentDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Agent.objects.exclude(Q(user__is_staff=True) | Q(user__is_superuser=True))
            .filter(Q(user__isnull=True) | Q(user__profile__profile_visible=True))
        )


class AgentReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = AgentReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_agent(self):
        try:
            return (
                Agent.objects.exclude(Q(user__is_staff=True) | Q(user__is_superuser=True))
                .filter(Q(user__isnull=True) | Q(user__profile__profile_visible=True))
                .get(slug=self.kwargs["slug"])
            )
        except Agent.DoesNotExist as exc:
            raise NotFound("Agent not found.") from exc

    def get_queryset(self):
        return AgentReview.objects.filter(agent=self.get_agent()).select_related("reviewer")

    def create(self, request, *args, **kwargs):
        agent = self.get_agent()
        if agent.user_id == request.user.id:
            raise PermissionDenied("You cannot rate your own profile.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review, created = AgentReview.objects.update_or_create(
            agent=agent,
            reviewer=request.user,
            defaults={
                "rating": serializer.validated_data["rating"],
                "comment": serializer.validated_data.get("comment", ""),
            },
        )
        output = self.get_serializer(review)
        return Response(output.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class MyAgentReviewsView(generics.ListAPIView):
    serializer_class = AgentReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        agent = getattr(self.request.user, "agent_profile", None)
        if not agent:
            return AgentReview.objects.none()
        return AgentReview.objects.filter(agent=agent).select_related("reviewer")


class AgentAdminBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, slug: str) -> Agent:
        return Agent.objects.get(slug=slug)

    def check_admin(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Only administrators can manage agents."}, status=status.HTTP_403_FORBIDDEN)
        return None


class AgentRevokeVerificationView(AgentAdminBaseView):
    def post(self, request, slug: str):
        admin_error = self.check_admin(request)
        if admin_error:
            return admin_error

        try:
            agent = self.get_object(slug)
        except Agent.DoesNotExist:
            return Response({"detail": "Agent not found."}, status=status.HTTP_404_NOT_FOUND)

        if not agent.is_verified:
            return Response({"detail": "Agent is already unverified."}, status=status.HTTP_400_BAD_REQUEST)

        agent.is_verified = False
        agent.save(update_fields=["is_verified", "updated_at"])
        return Response({"message": "Agent verification removed."}, status=status.HTTP_200_OK)


class AgentDeleteView(AgentAdminBaseView):
    def delete(self, request, slug: str):
        admin_error = self.check_admin(request)
        if admin_error:
            return admin_error

        try:
            agent = self.get_object(slug)
        except Agent.DoesNotExist:
            return Response({"detail": "Agent not found."}, status=status.HTTP_404_NOT_FOUND)

        agent.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
