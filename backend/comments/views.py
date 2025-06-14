from rest_framework import viewsets, permissions
from .models import Comment
from .serializers import CommentSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(parent__isnull=True)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.action == "list":
            post_id = self.request.query_params.get('post_id')
            if post_id:
                return Comment.objects.filter(post_id=post_id, parent__isnull=True)
            return Comment.objects.none()
        return Comment.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        comment = self.get_object()
        user = request.user
        if user in comment.likes.all():
            comment.likes.remove(user)
            liked = False
        else:
            comment.likes.add(user)
            liked = True
        return Response({
            "liked": liked,
            "likes": comment.likes.count()
        }, status=status.HTTP_200_OK)
        
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def replies(self, request, pk=None):
        parent_comment = self.get_object()
        serializer = ReplySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user, post=parent_comment.post, parent=parent_comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)