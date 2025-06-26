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
    def toggle_follow(self, request, pk=None):
        target_user = get_object_or_404(User, username=pk)

        if request.user == target_user:
            return Response({"detail": "You cannot follow yourself."}, status=400)

        existing = Follow.objects.filter(follower=request.user, following=target_user).first()
        if existing:
            existing.delete()
            return Response({"detail": "Unfollowed", "is_following": False})
        else:
            Follow.objects.create(follower=request.user, following=target_user)
            return Response({"detail": "Followed", "is_following": True})

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
    
    @action(detail=False, methods=["get"])
    def suggested(self, request):
        user = request.user

        following_ids = Follow.objects.filter(
            follower=user
        ).values_list('following_id', flat=True)

        # Người được bạn bè của bạn follow (mutual)
        mutual_follow_ids_qs = Follow.objects.filter(
            follower__in=following_ids
        ).exclude(following__in=following_ids)\
         .exclude(following=user)\
         .values('following')\
         .annotate(count=models.Count('following'))\
         .order_by('-count')[:20]

        mutual_user_ids = [item['following'] for item in mutual_follow_ids_qs]

        mutual_profiles = Profile.objects.filter(
            user__in=mutual_user_ids
        ).select_related('user')

        # Người nổi bật nếu chưa đủ
        extra_profiles = Profile.objects.exclude(
            user__in=following_ids
        ).exclude(user=user)\
        .annotate(follower_count=models.Count('user__followers'))\
        .order_by('-follower_count')[:20].select_related('user')

        # Gộp và loại trùng
        seen = set()
        all_profiles = []

        for profile in list(mutual_profiles) + list(extra_profiles):
            if profile.user_id not in seen:
                all_profiles.append(profile)
                seen.add(profile.user_id)
            if len(all_profiles) >= 10:
                break

        from users.serializers import SuggestedUserSerializer  # Đảm bảo import
        serializer = SuggestedUserSerializer(
            all_profiles,
            many=True,
            context={'request': request, 'following_ids': list(following_ids)}
        )
        return Response(serializer.data)
