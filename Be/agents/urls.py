from django.urls import path

from .views import (
    AgentDeleteView,
    AgentDetailView,
    AgentListView,
    AgentReviewListCreateView,
    AgentRevokeVerificationView,
    MyAgentReviewsView,
)


urlpatterns = [
    path("", AgentListView.as_view(), name="agent-list"),
    path("me/reviews/", MyAgentReviewsView.as_view(), name="agent-my-reviews"),
    path("<slug:slug>/revoke-verification/", AgentRevokeVerificationView.as_view(), name="agent-revoke-verification"),
    path("<slug:slug>/delete/", AgentDeleteView.as_view(), name="agent-delete"),
    path("<slug:slug>/reviews/", AgentReviewListCreateView.as_view(), name="agent-reviews"),
    path("<slug:slug>/", AgentDetailView.as_view(), name="agent-detail"),
]
