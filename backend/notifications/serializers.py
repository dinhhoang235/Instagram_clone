# notifications/serializers.py

from rest_framework import serializers
from .models import Notification
from posts.serializers import PostSerializer  # nếu bạn cần serialize post
from django.utils.timesince import timesince
from django.contrib.auth.models import User

class SenderSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.profile.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url

class NotificationSerializer(serializers.ModelSerializer):
    user = SenderSerializer(source="sender")
    time = serializers.SerializerMethodField()
    postImage = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'user', 'content', 'time', 'postImage']

    def get_time(self, obj):
        return timesince(obj.created_at) + " ago"

    def get_postImage(self, obj):
        if obj.post and obj.post.image:
            return obj.post.image.url
        return None
