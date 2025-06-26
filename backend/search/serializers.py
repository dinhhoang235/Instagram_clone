from rest_framework import serializers
from django.templatetags.static import static
from users.models import Profile


class RecentSearchUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ["id", "username", "avatar", "is_verified", "is_following"]

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url

    def get_is_following(self, obj):
        request_user = self.context.get('request').user
        return obj.is_following(request_user) if request_user.is_authenticated else False

class MinimalUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ["id", "username", "avatar"]

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url