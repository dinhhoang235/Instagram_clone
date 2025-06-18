from rest_framework import serializers 
from django.contrib.auth.models import User
from users.models import Profile
from posts.models import Post
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.templatetags.static import static



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

class ProfileShortSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['username', 'avatar', 'is_verified']

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    avatar = serializers.SerializerMethodField()
    avatarFile = serializers.ImageField(write_only=True, required=False)
    posts_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_self = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'username', 'email',
            'full_name', 'bio', 'website', 'phone_number', 'gender',
            'avatar', 'avatarFile', 'is_verified',
            'is_private', 'allow_tagging', 'show_activity', 'allow_story_resharing',
            'allow_comments', 'allow_messages',
            'posts_count', 'followers_count', 'following_count',
            'is_following', 'is_self',
        ]
    
    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url
    
    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatarFile', None)

        if validated_data.get('avatar') in [None, ""]:
            instance.avatar.delete(save=False)
            instance.avatar = None
            validated_data.pop('avatar', None) 

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if avatar_file:
            instance.avatar = avatar_file

        instance.save()
        return instance
    
    def get_posts_count(self, obj):
        return obj.get_post_count
    
    def get_followers_count(self, obj):
        return obj.get_follower_count
    
    def get_following_count(self, obj):
        return obj.get_following_count
    
    def get_is_following(self, obj):
        request_user = self.context.get('request').user
        return obj.is_following(request_user) if request_user.is_authenticated else False
    
    def get_is_self(self, obj):
        request_user = self.context.get('request').user
        return obj.is_self(request_user) if request_user.is_authenticated else False

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs
