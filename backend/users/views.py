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
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from users.models import Profile
from posts.models import Tag, Post


from users.models import Profile, Follow
from users.serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    ProfileSerializer, 
    PasswordChangeSerializer,
    CustomTokenObtainPairSerializer,
    ProfileShortSerializer,
)

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

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'full_name']
    
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

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related('user').all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Allow file uploads

    def get_object(self):
        pk = self.kwargs.get("pk")
        if pk == "me":
            return self.request.user.profile
        user = get_object_or_404(User, username=pk)
        return user.profile

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, pk=None):
        to_follow = get_object_or_404(User, username=pk)
        if request.user == to_follow:
            return Response({"detail": "You cannot follow yourself."}, status=400)
        Follow.objects.get_or_create(follower=request.user, following=to_follow)
        return Response({"detail": "Followed."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def unfollow(self, request, pk=None):
        to_unfollow = get_object_or_404(User, username=pk)
        Follow.objects.filter(follower=request.user, following=to_unfollow).delete()
        return Response({"detail": "Unfollowed."})

    @action(detail=True, methods=["get"])
    def followers(self, request, pk=None):
        user = get_object_or_404(User, username=pk)
        followers = User.objects.filter(following__following=user)
        profiles = Profile.objects.filter(user__in=followers)
        serializer = ProfileShortSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def following(self, request, pk=None):
        user = get_object_or_404(User, username=pk)
        following = User.objects.filter(followers__follower=user)
        profiles = Profile.objects.filter(user__in=following)
        serializer = ProfileShortSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)

class SearchAllAPIView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip()

        # USERS
        users = Profile.objects.filter(
            Q(user__username__icontains=query) |
            Q(full_name__icontains=query)
        )[:10]

        user_results = [
            {
                "id": profile.id,
                "username": profile.user.username,
                "name": profile.full_name,
                "avatar": profile.avatar.url if profile.avatar else "",
                "isVerified": profile.is_verified,
                "isFollowing": request.user.following.filter(id=profile.user.id).exists()
            }
            for profile in users
        ]

        # TAGS
        tags = Tag.objects.filter(name__icontains=query)[:10]
        tag_results = [
            {
                "id": tag.id,
                "name": tag.name,
                "postCount": f"{tag.posts.count()/1_000_000:.1f}M" if tag.posts.count() > 1_000_000 else str(tag.posts.count())
            }
            for tag in tags
        ]

        # PLACES (giả sử lấy từ Post.location)
        places_qs = Post.objects.filter(location__icontains=query).values("location").annotate(count=models.Count("id")).distinct()[:10]
        place_results = [
            {
                "id": str(index),
                "name": place["location"],
                "postCount": f"{place['count']/1_000_000:.1f}M" if place["count"] > 1_000_000 else str(place["count"])
            }
            for index, place in enumerate(places_qs, 1)
        ]

        # RECENT SEARCHES – có thể lưu từ session hoặc user.profile.recent_searches
        recent_searches = []  # tuỳ bạn xử lý

        return Response({
            "users": user_results,
            "tags": tag_results,
            "places": place_results,
            "recent_searches": recent_searches
        })
