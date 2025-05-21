from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User

from chats.models import Message
from chats.serializers import MessageSerializer, MessageThreadSerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().order_by('-date')
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users should only see their own messages
        user = self.request.user
        return Message.objects.filter(user=user).order_by('-date')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user, sender=self.request.user)
    
    @action(detail=False, methods=['get'])
    def threads(self, request):
        """
        Get all message threads for the current user
        """
        user = request.user
        threads = Message.get_messages(user)
        serializer = MessageThreadSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def conversation(self, request):
        """
        Get the conversation with a specific user
        """
        user = request.user
        other_username = request.query_params.get('username', None)
        
        if not other_username:
            return Response(
                {"detail": "Username parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            other_user = User.objects.get(username=other_username)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mark messages as read
        Message.mark_as_read(user, other_user)
        
        # Get conversation
        messages = Message.get_conversation(user, other_user)
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send(self, request):
        """
        Send a message to another user
        """
        sender = request.user
        recipient_username = request.data.get('username', None)
        body = request.data.get('body', None)
        
        if not recipient_username or not body:
            return Response(
                {"detail": "Username and body are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recipient = User.objects.get(username=recipient_username)
        except User.DoesNotExist:
            return Response(
                {"detail": "Recipient not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        message = Message.send_message(sender, recipient, body)
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get the count of unread messages for the current user
        """
        user = request.user
        count = Message.objects.filter(user=user, is_read=False).count()
        return Response({'unread_count': count})
