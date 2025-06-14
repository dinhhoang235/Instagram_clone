from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from posts.models import Post
from posts.serializers import PostSerializer
from rest_framework.response import Response

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().select_related('user', 'user__profile').prefetch_related('tags', 'likes')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
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
