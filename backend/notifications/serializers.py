# notifications/serializers.py

from rest_framework import serializers
from .models import Notification
from posts.serializers import PostSerializer  # nếu bạn cần serialize post
from django.utils.timesince import timesince
from django.contrib.auth.models import User
from users.models import Follow

class SenderSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'avatar', 'is_following']

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.profile.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url

    def get_is_following(self, obj):
        """
        Check if the current user (recipient of notification) is following the sender
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # obj is the sender, request.user is the recipient
        return Follow.objects.filter(follower=request.user, following=obj).exists()

class NotificationSerializer(serializers.ModelSerializer):
    user = SenderSerializer(source="sender")
    time = serializers.SerializerMethodField()
    postImage = serializers.SerializerMethodField()
    is_read = serializers.BooleanField()
    link = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'user', 'content', 'time', 'postImage', 'is_read', 'link']

    def get_time(self, obj):
        return timesince(obj.created_at) + " ago"

    def get_postImage(self, obj):
        if obj.post and obj.post.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.post.image.url)
            return obj.post.image.url  # fallback nếu không có request
        return None

    def get_link(self, obj):
        """
        Trả về link tương ứng như Instagram:
        - /p/{post_id} cho các loại like, comment, mention
        - /{username} cho loại follow
        """
        if obj.type in ["like", "comment", "mention"] and obj.post:
            return f"/post/{obj.post.id}"  # hoặc slug nếu bạn dùng slug
        elif obj.type == "follow":
            return f"/{obj.sender.username}"  # profile page
        return "/"