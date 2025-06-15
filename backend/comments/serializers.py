# serializers.py
from rest_framework import serializers
from .models import Comment
from users.serializers import ProfileShortSerializer

class ReplySerializer(serializers.ModelSerializer):
    user = ProfileShortSerializer(source='user.profile',read_only=True)
    timeAgo = serializers.SerializerMethodField()
    likes = serializers.IntegerField(source='likes_count', read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    # THÊM 2 TRƯỜNG write-only để tạo reply
    post = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.model.post.field.related_model.objects.all(), write_only=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), write_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'likes', 'is_liked', 'timeAgo', 'parent', 'post']

    def get_timeAgo(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.time_created) + " ago"
    
    def get_is_liked(self, obj):
        request = self.context.get('request', None)
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            return obj.likes.filter(id=user.id).exists()
        return False


class CommentSerializer(serializers.ModelSerializer):
    user = ProfileShortSerializer(source='user.profile',read_only=True)
    replies = serializers.SerializerMethodField()
    timeAgo = serializers.SerializerMethodField()
    likes = serializers.IntegerField(source='likes_count', read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'likes', 'is_liked', 'timeAgo', 'replies']

    def get_replies(self, obj):
        if obj.replies.exists():
            return ReplySerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def get_timeAgo(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.time_created) + " ago"
    
    def get_is_liked(self, obj):
        request = self.context.get('request', None)
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            return obj.likes.filter(id=user.id).exists()
        return False
