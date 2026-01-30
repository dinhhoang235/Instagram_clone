from rest_framework import serializers 
from django.contrib.auth.models import User
from users.models import Follow, Profile
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
            provided = (username_or_email or "").strip()
            if "@" in provided:
                raise serializers.ValidationError({"email": "No user found with this email."})
            raise serializers.ValidationError({"username": "No user found with this username."})

        authenticated_user = authenticate(username=user.username, password=password)
        if authenticated_user is None:
            raise serializers.ValidationError({"password": ("Invalid password.")})

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
        token = RefreshToken.for_user(user)
        
        token['user_id'] = user.id 
        token['username'] = user.username
        token['email'] = user.email
        
        return token
    
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
    full_name = serializers.CharField(allow_null=True, required=False, read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'full_name', 'avatar', 'is_verified']

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
    mutual_followers_count = serializers.SerializerMethodField()
    join_date = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'username', 'email',
            'full_name', 'bio', 'website', 'phone_number', 'gender',
            'avatar', 'avatarFile', 'is_verified',
            'is_private', 'allow_tagging', 'show_activity', 'allow_story_resharing',
            'allow_comments', 'allow_messages', 'theme',
            'posts_count', 'followers_count', 'following_count',
            'is_following', 'is_self', 'mutual_followers_count', 'join_date'
        ]
    
    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url
    
    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatarFile', None)

        # Chỉ xóa avatar nếu người dùng explicitly gửi empty value, không phải khi không gửi gì
        if 'avatar' in validated_data and validated_data.get('avatar') in [None, ""]:
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
    
    def get_mutual_followers_count(self, obj):
        request_user = self.context.get('request').user
        if not request_user.is_authenticated or request_user == obj.user:
            return 0

        # Người mà request_user đang theo dõi
        request_user_following_ids = request_user.following.values_list('following_id', flat=True)

        # Người mà profile user đang theo dõi
        profile_user_following_ids = obj.user.following.values_list('following_id', flat=True)

        # Mutual = cùng follow một số người
        mutual_ids = set(request_user_following_ids).intersection(profile_user_following_ids)
        return len(mutual_ids)
    
    def get_join_date(self, obj):
        joined = obj.user.date_joined
        return f"Joined {joined.strftime('%B %Y')}" 
    
# users/serializers.py
class SuggestedUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    avatar = serializers.SerializerMethodField()
    isVerified = serializers.BooleanField(source='is_verified')
    isFollowing = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()
    # Include profile full name (optional)
    full_name = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'avatar', 'isVerified', 'isFollowing', 'reason', 'full_name']

    def get_avatar(self, obj):
        request = self.context.get('request')
        url = obj.get_avatar
        if request:
            return request.build_absolute_uri(url) 
        return url

    def get_isFollowing(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj.user).exists()

    def get_reason(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return "Suggested for you"

        following_ids = self.context.get('following_ids', [])

        mutuals = Follow.objects.filter(
            follower__in=following_ids,
            following=obj.user
        ).values_list('follower__username', flat=True)

        mutual_list = list(mutuals)
        if mutual_list:
            if len(mutual_list) == 1:
                return f"Followed by {mutual_list[0]}"
            return f"Followed by {mutual_list[0]} + {len(mutual_list)-1} more"

        return "Suggested for you"


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs