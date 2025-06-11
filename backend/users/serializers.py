from rest_framework import serializers 
from django.contrib.auth.models import User
from users.models import Profile
from posts.models import Post
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get("username_or_email")
        password = attrs.get("password")

        user = (
            User.objects.filter(username=username_or_email).first()
            or User.objects.filter(email=username_or_email).first()
        )

        if user is None:
            raise serializers.ValidationError({
                "username_or_email": ("No user found with this username/email.")
            })

        authenticated_user = authenticate(username=user.username, password=password)
        if authenticated_user is None:
            raise serializers.ValidationError({"password": ("Invalid credentials.")})

        refresh = self.get_token(authenticated_user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }

    @classmethod
    def get_token(cls, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        return RefreshToken.for_user(user)
    
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)
    token = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'confirm_password', 
            'first_name', 'last_name', 'date_joined', 'token', 'full_name'
        ]
        read_only_fields = ['id', 'date_joined', 'token']

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        # Create or get the profile and update with full_name if provided
        if full_name:
            from users.models import Profile
            profile, created = Profile.objects.get_or_create(user=user)
            profile.full_name = full_name
            profile.save()
        
        return user

    def get_token(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Dedicated serializer for user registration
    """
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)
    token = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'confirm_password', 
            'first_name', 'last_name', 'date_joined', 'token', 'full_name'
        ]
        read_only_fields = ['id', 'date_joined', 'token']

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if username already exists
        if User.objects.filter(username=attrs.get('username')).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        
        # Check if email already exists
        if attrs.get('email') and User.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})
        
        return attrs
    
    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        # Create or get the profile and update with full_name if provided
        if full_name:
            from users.models import Profile
            profile, created = Profile.objects.get_or_create(user=user)
            profile.full_name = full_name
            profile.save()
        
        return user

    def get_token(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'username', 'email', 'display_name', 
            'full_name', 'location', 'url', 'bio', 
            'created', 'image', 'post_count', 'follower_count', 
            'following_count', 'is_following'
        ]
        read_only_fields = ['id', 'user', 'created']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_email(self, obj):
        return obj.user.email
    
    def get_display_name(self, obj):
        return obj.get_full_name
    
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
    
    def get_image(self, obj):
        request = self.context.get('request')
        url = obj.get_image  # lấy URL tương đối từ model
        if request:
            return request.build_absolute_uri(url)  # thành URL tuyệt đối
        return url

class ProfileUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=False)
    location = serializers.CharField(required=False)
    url = serializers.URLField(required=False)
    bio = serializers.CharField(required=False)
    image = serializers.ImageField(required=False)
    
    class Meta:
        model = Profile
        fields = ['full_name', 'location', 'url', 'bio', 'image']

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class ProfileListSerializer(serializers.ModelSerializer):
    """Simplified serializer for profile lists"""
    username = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ['id', 'username', 'display_name', 'image', 'is_following']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_display_name(self, obj):
        return obj.get_full_name
    
    def get_image(self, obj):
        request = self.context.get('request')
        url = obj.get_image
        if request:
            return request.build_absolute_uri(url)
        return url
    
    def get_is_following(self, obj):
        from posts.models import Follow
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj.user).exists()
        return False

class UserSearchSerializer(serializers.ModelSerializer):
    """Serializer for user search results"""
    profile = ProfileListSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'profile']

class ProfileDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for profile detail views"""
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    favourite_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_own_profile = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'username', 'email', 'display_name', 
            'full_name', 'location', 'url', 'bio', 'created',
            'image', 'post_count', 'follower_count', 'following_count',
            'favourite_count', 'is_following', 'is_own_profile'
        ]
        read_only_fields = ['id', 'user', 'created']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_email(self, obj):
        return obj.user.email
    
    def get_display_name(self, obj):
        return obj.get_full_name
    
    def get_post_count(self, obj):
        return obj.get_post_count
    
    def get_follower_count(self, obj):
        return obj.get_follower_count
    
    def get_following_count(self, obj):
        return obj.get_following_count
    
    def get_favourite_count(self, obj):
        return obj.get_favourites_count
    
    def get_is_following(self, obj):
        from posts.models import Follow
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj.user).exists()
        return False
    
    def get_is_own_profile(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
    
    def get_image(self, obj):
        request = self.context.get('request')
        url = obj.get_image
        if request:
            return request.build_absolute_uri(url)
        return url