from django.contrib.auth.models import User
from rest_framework import serializers

from agents.models import Agent
from utils.supabase_storage import build_media_url

from .models import UserProfile, VerificationRequest


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "password", "password_confirm"]

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Passwords do not match.")
        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError("This email is already in use.")
        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)
    agent_is_verified = serializers.SerializerMethodField()
    agent_slug = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()
    verification_message = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "avatar",
            "address",
            "short_intro",
            "bio",
            "profile_visible",
            "activity_visible",
            "created_at",
            "is_staff",
            "is_superuser",
            "agent_is_verified",
            "agent_slug",
            "verification_status",
            "verification_message",
        ]

    def validate_short_intro(self, value):
        normalized = (value or "").strip()
        if not normalized:
            return normalized

        word_count = len([word for word in normalized.split() if word])
        if word_count > 50:
            raise serializers.ValidationError("Short intro must be 50 words or fewer.")

        return normalized

    def _get_agent(self, instance: UserProfile):
        return Agent.objects.filter(user=instance.user).first()

    def _get_latest_request(self, instance: UserProfile):
        return instance.user.verification_requests.order_by("-created_at").first()

    def get_agent_is_verified(self, instance: UserProfile):
        agent = self._get_agent(instance)
        return bool(agent and agent.is_verified)

    def get_agent_slug(self, instance: UserProfile):
        agent = self._get_agent(instance)
        return agent.slug if agent else None

    def get_verification_status(self, instance: UserProfile):
        request = self._get_latest_request(instance)
        return request.status if request else None

    def get_verification_message(self, instance: UserProfile):
        request = self._get_latest_request(instance)
        if not request:
            return None
        if request.status == VerificationRequest.Status.DENIED:
            return request.denial_reason or "Your verification request was denied."
        if request.status == VerificationRequest.Status.PENDING:
            return "Your verification request is pending review."
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data["avatar"] = build_media_url(instance.avatar, self.context.get("request"))
        return data

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        instance.user.first_name = user_data.get("first_name", instance.user.first_name)
        instance.user.last_name = user_data.get("last_name", instance.user.last_name)
        instance.user.save()
        return super().update(instance, validated_data)


class VerificationRequestSerializer(serializers.ModelSerializer):
    id_card_front = serializers.ImageField()
    id_card_back = serializers.ImageField()

    class Meta:
        model = VerificationRequest
        fields = [
            "id",
            "full_name",
            "date_of_birth",
            "address",
            "gender",
            "national_id_number",
            "id_card_front",
            "id_card_back",
            "status",
            "denial_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "denial_reason", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        for key in ("id_card_front", "id_card_back"):
            file_value = getattr(instance, key, None)
            data[key] = build_media_url(file_value, request) if file_value else data.get(key)
        return data


class AdminVerificationRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    agent_slug = serializers.SerializerMethodField()

    class Meta:
        model = VerificationRequest
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "date_of_birth",
            "address",
            "gender",
            "national_id_number",
            "id_card_front",
            "id_card_back",
            "status",
            "denial_reason",
            "agent_slug",
            "created_at",
            "updated_at",
        ]

    def get_agent_slug(self, instance: VerificationRequest):
        agent = Agent.objects.filter(user=instance.user).first()
        return agent.slug if agent else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        for key in ("id_card_front", "id_card_back"):
            file_value = getattr(instance, key, None)
            data[key] = build_media_url(file_value, request) if file_value else data.get(key)
        return data


class VerificationDecisionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accept", "deny"])
    denial_reason = serializers.CharField(required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError("New passwords do not match.")
        return data


class ForgotPasswordRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError("New passwords do not match.")
        return data
