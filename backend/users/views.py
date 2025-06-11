from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.shortcuts import get_object_or_404
from django.db import models
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenViewBase

from users.models import Profile
from users.serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    ProfileSerializer, 
    ProfileUpdateSerializer,
    PasswordChangeSerializer,
    CustomTokenObtainPairSerializer,
)
from posts.models import Post, Follow


class CustomTokenObtainPairView(TokenViewBase):
    serializer_class = CustomTokenObtainPairSerializer

@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationView(APIView):
    """
    Dedicated view for user registration
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Serialize lại để đảm bảo `get_token` được gọi
        full_serializer = UserRegistrationSerializer(user)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED)

@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_queryset(self):
        # For most actions, users should only see their own data
        if self.action in ['list', 'retrieve']:
            return User.objects.filter(id=self.request.user.id)
        return super().get_queryset()
    
    # Remove the create method since registration is now handled separately
    def create(self, request, *args, **kwargs):
        return Response(
            {'error': 'Registration not allowed through this endpoint. Use /api/register/ instead.'}, 
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Return data for the currently authenticated user"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change password for the currently authenticated user"""
        user = request.user
        serializer = PasswordChangeSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.data.get('old_password')):
                return Response(
                    {'old_password': ['Wrong password.']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.data.get('new_password'))
            user.save()
            update_session_auth_hash(request, user)  # Keep user logged in
            return Response({'status': 'password updated'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__username', 'full_name', 'location']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        username = self.request.query_params.get('username', None)
        
        if username is not None:
            queryset = queryset.filter(user__username=username)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ProfileUpdateSerializer
        return ProfileSerializer
    
    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Return profile data for the currently authenticated user"""
        profile = get_object_or_404(Profile, user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def suggested_users(self, request):
        """Return profiles the user might want to follow"""
        user = request.user
        # Get users that the current user is not following
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        profiles = Profile.objects.exclude(user=user).exclude(user_id__in=following_ids)[:5]
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Update the profile for the currently authenticated user"""
        profile = get_object_or_404(Profile, user=request.user)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(ProfileSerializer(profile, context={'request': request}).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """Get posts for a specific profile"""
        from posts.serializers import PostSerializer
        
        profile = self.get_object()
        posts = Post.objects.filter(user=profile.user).order_by('-posted')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        """Get followers for a specific profile"""
        from posts.serializers import FollowSerializer
        
        profile = self.get_object()
        followers = Follow.objects.filter(following=profile.user)
        serializer = FollowSerializer(followers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        """Get users that this profile is following"""
        from posts.serializers import FollowSerializer
        
        profile = self.get_object()
        following = Follow.objects.filter(follower=profile.user)
        serializer = FollowSerializer(following, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_users(self, request):
        """Search for users by username or full name"""
        from users.serializers import UserSearchSerializer
        
        query = request.query_params.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)
        
        # Search in both username and profile full_name
        profiles = Profile.objects.filter(
            models.Q(user__username__icontains=query) |
            models.Q(full_name__icontains=query)
        ).select_related('user')[:10]
        
        users = [profile.user for profile in profiles]
        serializer = UserSearchSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommended_users(self, request):
        """Get recommended users to follow"""
        from users.serializers import ProfileListSerializer
        
        user = request.user
        
        # Get users that the current user is not following
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        
        # Exclude current user and already followed users
        profiles = Profile.objects.exclude(user=user).exclude(user_id__in=following_ids)
        
        # You can add more sophisticated recommendation logic here
        # For now, just return random profiles
        profiles = profiles.order_by('?')[:10]
        
        serializer = ProfileListSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def detail_view(self, request, pk=None):
        """Get detailed profile information"""
        from users.serializers import ProfileDetailSerializer
        
        profile = self.get_object()
        serializer = ProfileDetailSerializer(profile, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """Follow a user"""
        profile = self.get_object()
        user_to_follow = profile.user
        
        if user_to_follow == request.user:
            return Response(
                {'error': 'You cannot follow yourself'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow_obj, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        
        if created:
            return Response({'status': 'following'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'status': 'already following'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        """Unfollow a user"""
        profile = self.get_object()
        user_to_unfollow = profile.user
        
        try:
            follow_obj = Follow.objects.get(
                follower=request.user,
                following=user_to_unfollow
            )
            follow_obj.delete()
            return Response({'status': 'unfollowed'}, status=status.HTTP_200_OK)
        except Follow.DoesNotExist:
            return Response(
                {'error': 'You are not following this user'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def favourites(self, request):
        """Get user's favourite posts"""
        from posts.serializers import PostSerializer
        
        profile = get_object_or_404(Profile, user=request.user)
        favourite_posts = profile.get_favourites
        serializer = PostSerializer(favourite_posts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def upload_avatar(self, request):
        """Upload profile avatar"""
        profile = get_object_or_404(Profile, user=request.user)
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.image = request.FILES['image']
        profile.save()
        
        from users.serializers import ProfileDetailSerializer
        serializer = ProfileDetailSerializer(profile, context={'request': request})
        return Response(serializer.data)

