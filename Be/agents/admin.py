from django.contrib import admin

from .models import Agent, AgentReview


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "city", "specialization", "rating", "total_reviews", "is_verified")
    list_filter = ("is_verified", "city")
    search_fields = ("full_name", "user__username", "user__email", "specialization", "city", "email", "phone")
    prepopulated_fields = {"slug": ("full_name",)}


@admin.register(AgentReview)
class AgentReviewAdmin(admin.ModelAdmin):
    list_display = ("agent", "reviewer", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("agent__full_name", "reviewer__username", "reviewer__email", "comment")
    readonly_fields = ("created_at", "updated_at")
