from rest_framework import serializers 
from django.contrib.auth.models import User
from users.models import Profile
from posts.models import Post

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']
    
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'username', 'email', 'full_name', 
            'first_name', 'last_name', 'location', 'url', 'bio', 
            'created', 'image', 'post_count', 'follower_count', 
            'following_count', 'is_following'
        ]
        read_only_fields = ['id', 'user', 'created']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_email(self, obj):
        return obj.user.email
    
    def get_full_name(self, obj):
        first = obj.first_name or obj.user.first_name or ''
        last = obj.last_name or obj.user.last_name or ''
        if first and last:
            return f"{first} {last}"
        return first or last or obj.user.username
    
    def get_post_count(self, obj):
        return Post.objects.filter(user=obj.user).count()
    
    def get_follower_count(self, obj):
        from posts.models import Follow
        return Follow.objects.filter(following=obj.user).count()
    
    def get_following_count(self, obj):
        from posts.models import Follow
        return Follow.objects.filter(follower=obj.user).count()
    
    def get_is_following(self, obj):
        from posts.models import Follow
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj.user).exists()
        return False

class ProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    location = serializers.CharField(required=False)
    url = serializers.URLField(required=False)
    bio = serializers.CharField(required=False)
    image = serializers.ImageField(required=False)
    
    class Meta:
        model = Profile
        fields = ['first_name', 'last_name', 'location', 'url', 'bio', 'image']

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs
