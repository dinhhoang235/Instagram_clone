from rest_framework import viewsets, permissions
from posts.permissions import IsOwnerOrReadOnly
from rest_framework.decorators import action
from posts.models import Post, Tag, PostImage
from posts.serializers import PostSerializer
from rest_framework.response import Response
from posts.serializers import TagSerializer
from django.db.models import Count

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    # Require authentication for write operations and ensure only owners can modify/delete
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        queryset = Post.objects.all().select_related('user', 'user__profile').prefetch_related('tags', 'likes', 'post_images')
        user = self.request.query_params.get('user')
        if user:
            queryset = queryset.filter(user__username=user)
        return queryset
    
    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        import json

        files = request.FILES.getlist('image')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(user=request.user)

        # parse additional fields from request.data
        alt_texts_raw = request.data.get('alt_texts')
        alt_texts = None
        if alt_texts_raw:
            try:
                alt_texts = json.loads(alt_texts_raw)
            except Exception:
                alt_texts = None

        hide_likes_raw = request.data.get('hide_likes')
        disable_comments_raw = request.data.get('disable_comments')
        if hide_likes_raw is not None:
            post.hide_likes = str(hide_likes_raw).lower() in ('1', 'true', 'yes')
        if disable_comments_raw is not None:
            post.disable_comments = str(disable_comments_raw).lower() in ('1', 'true', 'yes')
        post.save()

        # Create PostImage objects for each uploaded file
        for i, f in enumerate(files):
            alt = None
            if isinstance(alt_texts, list) and i < len(alt_texts):
                alt = alt_texts[i]
            pi = PostImage.objects.create(post=post, image=f, order=i, alt_text=alt)
            # set main image if not already set
            if i == 0 and not post.image:
                post.image = pi.image
                post.save(update_fields=['image'])

        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(post, context=self.get_serializer_context()).data, status=201, headers=headers)
        
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def feed(self, request):
        user = request.user
        # Lấy danh sách ID người dùng mà mình đang follow + chính mình
        following_ids = list(user.following.values_list('following__id', flat=True))
        following_ids.append(user.id)  # thêm bài viết của chính mình
        # Lấy post từ danh sách này
        posts = Post.objects.filter(
            user__id__in=following_ids
        ).select_related('user', 'user__profile').prefetch_related('tags', 'likes').order_by('-posted')

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = PostSerializer(posts, many=True, context=self.get_serializer_context())
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def explore(self, request):
        user = request.user

        # Lọc các bài viết KHÔNG phải của user hiện tại
        posts = Post.objects.exclude(user=user).select_related('user', 'user__profile').prefetch_related('tags', 'likes')

        # Có thể random hoặc order_by theo "-posted"
        posts = posts.order_by('-posted')  # Hoặc .order_by('?') nếu muốn random

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = PostSerializer(posts, many=True, context=self.get_serializer_context())
        return Response(serializer.data)
        
    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user

        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True

        return Response({
            'status': 'liked' if liked else 'unliked',
            'likes': post.likes.count(),
            'is_liked': liked
        })

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        """Toggle save/bookmark for the authenticated user"""
        post = self.get_object()
        profile = request.user.profile

        if profile.saved_posts.filter(id=post.id).exists():
            profile.saved_posts.remove(post)
            saved = False
        else:
            profile.saved_posts.add(post)
            saved = True

        return Response({
            'status': 'saved' if saved else 'unsaved',
            'is_saved': saved
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def saved(self, request):
        """Return posts saved by the current authenticated user"""
        posts = request.user.profile.saved_posts.select_related('user', 'user__profile').prefetch_related('tags', 'likes').order_by('-posted')

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)

        serializer = PostSerializer(posts, many=True, context=self.get_serializer_context())
        return Response(serializer.data)
    @action(detail=False, methods=["get"], url_path="places/popular")
    def popular_places(self, request):
        places = (
            Post.objects
            .exclude(location__isnull=True)
            .exclude(location__exact="")
            .values("location")
            .annotate(postCount=Count("id"))
            .order_by("-postCount")[:20]
        )
        return Response(places)

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    @action(detail=False, methods=['get'], url_path='trending')
    def trending(self, request):
        tags = (
            Tag.objects.annotate(postCount=Count("posts"))
            .filter(postCount__gt=0)
            .order_by("-postCount")[:20]
        )
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)