from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from .pagination import NotificationCursorPagination
from rest_framework import status

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = NotificationCursorPagination 

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get("unread") == "true":
            queryset = queryset.filter(is_read=False)
        return queryset

    @action(detail=False, methods=["post"])
    def mark_all_as_read(self, request):
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({"status": "marked_all_read"})
    
    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        try:
            notification = Notification.objects.get(id=pk, recipient=request.user)
            if not notification.is_read:
                notification.is_read = True
                notification.save()
            return Response({"status": "marked_read"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)