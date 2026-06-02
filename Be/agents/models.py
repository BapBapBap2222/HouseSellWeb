from decimal import Decimal, ROUND_HALF_UP

from django.db import models
from django.db.models import Avg, Count
from django.contrib.auth.models import User


class Agent(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        related_name="agent_profile",
        blank=True,
        null=True,
    )
    full_name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=120, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    years_experience = models.PositiveSmallIntegerField(default=0)
    total_listings = models.PositiveIntegerField(default=0)
    deals_closed = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    response_time = models.CharField(max_length=100, blank=True)
    areas = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_verified", "-rating", "-total_reviews", "full_name"]

    def __str__(self):
        return self.full_name

    def refresh_review_stats(self):
        stats = self.reviews.aggregate(average=Avg("rating"), count=Count("id"))
        average = stats["average"] or 0
        self.rating = Decimal(str(average)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.total_reviews = stats["count"] or 0
        self.save(update_fields=["rating", "total_reviews", "updated_at"])


class AgentReview(models.Model):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="agent_reviews")
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["agent", "reviewer"]

    def __str__(self):
        return f"{self.reviewer.username} rated {self.agent.full_name}: {self.rating}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.agent.refresh_review_stats()

    def delete(self, *args, **kwargs):
        agent = self.agent
        result = super().delete(*args, **kwargs)
        agent.refresh_review_stats()
        return result
