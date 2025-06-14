from rest_framework import serializers
from posts.models import Post 
from django.contrib.auth.models import User


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


class PostSerializer(serializers.ModelSerializer):
    user = PostUserSerializer(read_only=True)
    likes = serializers.IntegerField(source='likes_count', read_only=True)
    comments = serializers.IntegerField(source='comments_count', read_only=True)
    timeAgo = serializers.CharField(source='time_ago', read_only=True)
    hashtags = serializers.SerializerMethodField()
    image = serializers.ImageField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'image', 'caption', 'hashtags',
            'likes', 'is_liked', 'comments', 'timeAgo', 'location'
        ]

    def get_hashtags(self, obj):
        return " ".join(f"#{tag.name}" for tag in obj.tags.all())
    
    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False
