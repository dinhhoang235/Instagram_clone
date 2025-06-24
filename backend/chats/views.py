from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Thread, Message
from .serializers import ConversationSerializer, MessageSerializer
from .pagination import MessagePagination
from django.contrib.auth.models import User
from django.db.models import Q

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        threads = Thread.objects.filter(users=request.user).order_by('-updated')
        serializer = ConversationSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Check if a thread already exists between these users
        threads = Thread.objects.filter(users=request.user).filter(users=other_user)
        
        if threads.exists():
            thread = threads.first()
        else:
            # Create a new thread
            thread = Thread.objects.create()
            thread.users.add(request.user, other_user)
            
        return Response({"thread_id": thread.id}, status=status.HTTP_201_CREATED)

class ThreadMessageListView(ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_queryset(self):
        thread_id = self.kwargs['thread_id']
        return Message.objects.filter(thread_id=thread_id).order_by('timestamp')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class MarkThreadAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, thread_id):
        try:
            print(f"👁️ User {request.user.id} ({request.user.username}) marking thread {thread_id} as read")
            
            # Check if the thread exists and user has access
            thread = Thread.objects.filter(id=thread_id, users=request.user).first()
            if not thread:
                return Response(
                    {"error": "Thread not found or you don't have access"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Mark all messages in the thread as read by this user
            # First get all messages not sent by this user
            other_messages = Message.objects.filter(
                thread_id=thread_id
            ).exclude(sender=request.user)
            
            # Then find which ones aren't already read by this user
            # Using a more efficient approach with a subquery
            unread_messages = other_messages.exclude(read_by=request.user)
            
            count = unread_messages.count()
            print(f"📊 Found {count} unread messages in thread {thread_id} for user {request.user.id}")
            print(f"Marking {count} messages as read by user {request.user.id}")
            
            # Process each message individually
            for message in unread_messages:
                message.read_by.add(request.user)
                print(f"✓ Marked message {message.id} as read by user {request.user.id}")
            
            # Always update the thread's timestamp for consistency
            # This helps with sorting in the UI after marking as read
            thread.save(update_fields=['updated'])
            print(f"🔄 Updated thread {thread_id} timestamp")
            
            return Response(
                {
                    "status": "success", 
                    "marked_read": count, 
                    "thread_id": thread_id,
                    "user_id": request.user.id,
                    "username": request.user.username
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"❌ Error marking thread {thread_id} as read: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )