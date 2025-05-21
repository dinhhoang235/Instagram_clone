from rest_framework import serializers
from posts.models import Tag, Post, Follow, Stream, Likes
from django.contrib.auth.models import User

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'title', 'slug']
        read_only_fields = ['slug']

class PostSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Tag.objects.all(),
        source='tags',
        required=False
    )
    
    user = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    username = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'picture', 'caption', 'posted', 'tags', 'tag_ids',
            'user', 'username', 'likes', 'like_count', 'is_liked'
        ]
        read_only_fields = ['id', 'posted', 'likes']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_like_count(self, obj):
        return obj.likes
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            return Likes.objects.filter(user=user, post=obj).exists()
        return False
    
    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        # Set the current user as the post owner
        validated_data['user'] = self.context['request'].user
        post = Post.objects.create(**validated_data)
        post.tags.set(tags)
        return post

class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.SerializerMethodField()
    following_username = serializers.SerializerMethodField()
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'follower_username', 'following_username']
        read_only_fields = ['id']
    
    def get_follower_username(self, obj):
        return obj.follower.username
    
    def get_following_username(self, obj):
        return obj.following.username
    
    def create(self, validated_data):
        # Ensure we don't create duplicate follow relationships
        follower = validated_data.get('follower')
        following = validated_data.get('following')
        
        if follower == following:
            raise serializers.ValidationError("You cannot follow yourself.")
            
        if Follow.objects.filter(follower=follower, following=following).exists():
            raise serializers.ValidationError("You are already following this user.")
            
        return super().create(validated_data)

class StreamSerializer(serializers.ModelSerializer):
    following_username = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    post_details = PostSerializer(source='post', read_only=True)
    
    class Meta:
        model = Stream
        fields = ['id', 'following', 'user', 'post', 'date', 
                  'following_username', 'user_username', 'post_details']
        read_only_fields = ['id', 'date']
    
    def get_following_username(self, obj):
        return obj.following.username
    
    def get_user_username(self, obj):
        return obj.user.username

class LikesSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    post_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Likes
        fields = ['id', 'user', 'post', 'username', 'post_details']
        read_only_fields = ['id']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_post_details(self, obj):
        return {'id': obj.post.id, 'caption': obj.post.caption}
    
    def create(self, validated_data):
        user = validated_data.get('user')
        post = validated_data.get('post')
        
        # Check if the like already exists
        if Likes.objects.filter(user=user, post=post).exists():
            raise serializers.ValidationError("You have already liked this post.")
        
        # Create the like and increment the post's like count
        like = Likes.objects.create(**validated_data)
        post.likes += 1
        post.save()
        
        return like
    
    def delete(self, instance):
        # Decrement the post's like count
        post = instance.post
        post.likes -= 1
        post.save()
        
        # Delete the like
        instance.delete()
