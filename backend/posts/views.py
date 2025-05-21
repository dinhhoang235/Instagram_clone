from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth.models import User

from posts.models import Tag, Post, Follow, Stream, Likes
from posts.serializers import (
    TagSerializer, 
    PostSerializer, 
    FollowSerializer, 
    StreamSerializer, 
    LikesSerializer
)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']
    
    @action(detail=False)
    def popular(self, request):
        # This method would return most popular tags
        # Implementation depends on how you define popularity (e.g., most posts)
        popular_tags = Tag.objects.all()[:10]  # Just a placeholder
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-posted')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['caption', 'tags__title', 'user__username']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        tag = self.request.query_params.get('tag', None)
        user = self.request.query_params.get('user', None)
        
        if tag is not None:
            queryset = queryset.filter(tags__slug=tag)
        
        if user is not None:
            queryset = queryset.filter(user__username=user)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        
        # Check if already liked
        if Likes.objects.filter(user=user, post=post).exists():
            return Response(
                {"detail": "You have already liked this post."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create like
        Likes.objects.create(user=user, post=post)
        post.likes += 1
        post.save()
        
        return Response({"status": "liked"}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        post = self.get_object()
        user = request.user
        
        # Check if already liked
        like = Likes.objects.filter(user=user, post=post).first()
        if not like:
            return Response(
                {"detail": "You have not liked this post."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove like
        like.delete()
        post.likes -= 1
        post.save()
        
        return Response({"status": "unliked"}, status=status.HTTP_200_OK)
    
    @action(detail=False)
    def feed(self, request):
        user = request.user
        stream_items = Stream.objects.filter(user=user).order_by('-date')
        post_ids = stream_items.values_list('post_id', flat=True)
        
        posts = Post.objects.filter(id__in=post_ids).order_by('-posted')
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def explore(self, request):
        # Return posts that the user might be interested in
        # This is a simple implementation - you might want more sophisticated recommendation logic
        user = request.user
        following_users = Follow.objects.filter(follower=user).values_list('following', flat=True)
        
        # Exclude posts from users that the current user follows
        posts = Post.objects.exclude(user=user).exclude(user__in=following_users).order_by('-posted')[:20]
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

class FollowViewSet(viewsets.ModelViewSet):
    queryset = Follow.objects.all()
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.query_params.get('user', None)
        follower = self.request.query_params.get('follower', None)
        following = self.request.query_params.get('following', None)
        
        if user is not None:
            # Get all follow relationships where the user is either following or a follower
            queryset = queryset.filter(
                Q(follower__username=user) | Q(following__username=user)
            )
        
        if follower is not None:
            queryset = queryset.filter(follower__username=follower)
        
        if following is not None:
            queryset = queryset.filter(following__username=following)
            
        return queryset
    
    @action(detail=False)
    def followers(self, request):
        # Get users who follow the current user
        user = request.user
        followers = Follow.objects.filter(following=user)
        serializer = self.get_serializer(followers, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def following(self, request):
        # Get users that the current user follows
        user = request.user
        following = Follow.objects.filter(follower=user)
        serializer = self.get_serializer(following, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def follow_user(self, request):
        username = request.data.get('username')
        if not username:
            return Response(
                {"detail": "Username is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_follow = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user_to_follow == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Follow.objects.filter(follower=request.user, following=user_to_follow).exists():
            return Response(
                {"detail": "You are already following this user."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow = Follow.objects.create(follower=request.user, following=user_to_follow)
        serializer = self.get_serializer(follow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def unfollow_user(self, request):
        username = request.data.get('username')
        if not username:
            return Response(
                {"detail": "Username is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_unfollow = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        follow = Follow.objects.filter(follower=request.user, following=user_to_unfollow).first()
        if not follow:
            return Response(
                {"detail": "You are not following this user."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow.delete()
        return Response({"status": "unfollowed"}, status=status.HTTP_200_OK)

class StreamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stream.objects.all().order_by('-date')
    serializer_class = StreamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only return streams for the current user
        return Stream.objects.filter(user=self.request.user).order_by('-date')

class LikesViewSet(viewsets.ModelViewSet):
    queryset = Likes.objects.all()
    serializer_class = LikesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.query_params.get('user', None)
        post = self.request.query_params.get('post', None)
        
        if user is not None:
            queryset = queryset.filter(user__username=user)
        
        if post is not None:
            queryset = queryset.filter(post_id=post)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Make sure users can only delete their own likes
        if instance.user != request.user:
            return Response(
                {"detail": "You cannot delete other users' likes."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use the delete method from the serializer to handle like count update
        self.get_serializer().delete(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
