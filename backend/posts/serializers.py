from rest_framework import serializers
from posts.models import Post, Tag, PostImage
from django.contrib.auth.models import User
import re


class PostUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='profile.full_name')
    avatar = serializers.SerializerMethodField()
    isVerified = serializers.BooleanField(source='profile.is_verified')
    class Meta:
        model = User
        fields = ['username', 'name', 'avatar', 'isVerified']

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.profile.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url

    def get_followers(self, obj):
        return obj.followers.count()

    def get_following(self, obj):
        return obj.following.count()

    def get_posts(self, obj):
        return obj.posts.count()


class PostImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = ['id', 'image', 'order', 'alt_text']

    def get_image(self, obj):
        request = self.context.get('request')
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class PostSerializer(serializers.ModelSerializer):
    user = PostUserSerializer(read_only=True)
    likes = serializers.IntegerField(source='likes_count', read_only=True)
    comments = serializers.IntegerField(source='comments_count', read_only=True)
    timeAgo = serializers.CharField(source='time_ago', read_only=True)
    hashtags = serializers.SerializerMethodField()
    images = PostImageSerializer(many=True, read_only=True, source='post_images')
    image = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'image', 'images', 'caption', 'hashtags',
            'likes', 'is_liked', 'is_saved', 'comments', 'timeAgo', 'location', 'hide_likes', 'disable_comments'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        # prefer first PostImage if exists
        first = obj.post_images.order_by('order').first()
        if first:
            url = first.image.url
        elif obj.image:
            url = obj.image.url
        else:
            return None
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user.profile.saved_posts.filter(id=obj.id).exists()
        return False

    def get_hashtags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False
    
class TagSerializer(serializers.ModelSerializer):
    postCount = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ['id', 'name', 'postCount']
    
