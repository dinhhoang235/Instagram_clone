from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from notifications.models import Notification
from notifications.serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all().order_by('-date')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users should only see their own notifications
        user = self.request.user
        return Notification.objects.filter(user=user).order_by('-date')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Get all unread notifications for the current user
        """
        user = request.user
        notifications = Notification.objects.filter(user=user, is_seen=False).order_by('-date')
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_seen(self, request):
        """
        Mark all notifications as seen for the current user
        """
        user = request.user
        Notification.mark_as_seen(user)
        return Response({'status': 'notifications marked as seen'})
    
    @action(detail=True, methods=['post'])
    def mark_as_seen(self, request, pk=None):
        """
        Mark a specific notification as seen
        """
        notification = self.get_object()
        notification.is_seen = True
        notification.save()
        return Response({'status': 'notification marked as seen'})
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """
        Get the count of unread notifications for the current user
        """
        user = request.user
        count = Notification.objects.filter(user=user, is_seen=False).count()
        return Response({'count': count})
