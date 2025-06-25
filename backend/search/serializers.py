from rest_framework import serializers
from django.templatetags.static import static
from django.contrib.auth.models import User


class RecentSearchUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    isVerified = serializers.SerializerMethodField()
    isFollowing = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar", "isVerified", "isFollowing"]

    def get_avatar(self, obj):
        request = self.context.get("request")
        default_avatar = static("images/default.jpg")

        profile = getattr(obj, "profile", None)
        if profile and getattr(profile, "avatar", None):
            url = profile.avatar.url
        else:
            url = default_avatar

        return request.build_absolute_uri(url) if request else url

    def get_isVerified(self, obj):
        profile = getattr(obj, "profile", None)
        return getattr(profile, "is_verified", False)

    def get_isFollowing(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        if user and user.is_authenticated:
            return user.following.filter(id=obj.id).exists()
        return False
