from rest_framework import viewsets, permissions
from .models import Comment
from .serializers import CommentSerializer, ReplySerializer
from .pagination import CommentPagination
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework import serializers

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(parent__isnull=True)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = CommentPagination

    def get_queryset(self):
        if self.action == "list":
            post_id = self.request.query_params.get('post_id')
            if post_id:
                return Comment.objects.filter(post_id=post_id, parent__isnull=True)
            return Comment.objects.none()
        return Comment.objects.all()

    def perform_create(self, serializer):
        post_id = self.request.data.get('post')
        if not post_id:
            raise serializers.ValidationError({"post": "This field is required."})

        serializer.save(user=self.request.user, post_id=post_id)

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

        # Inject post_id và parent_id để ReplySerializer xử lý
        data = request.data.copy()
        data["post"] = str(parent_comment.post.id)
        data["parent"] = str(parent_comment.id)

        serializer = ReplySerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)