from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    short_intro = models.CharField(max_length=280, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_visible = models.BooleanField(default=True)
    activity_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


class VerificationRequest(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DENIED = "denied", "Denied"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_requests")
    full_name = models.CharField(max_length=120)
    date_of_birth = models.DateField()
    address = models.TextField()
    gender = models.CharField(max_length=10, choices=Gender.choices)
    national_id_number = models.CharField(max_length=32)
    id_card_front = models.ImageField(upload_to="verification/id_cards/")
    id_card_back = models.ImageField(upload_to="verification/id_cards/")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    denial_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reviewed_verification_requests",
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Verification request #{self.pk} - {self.user.username}"
