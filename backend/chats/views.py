from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Thread, Message
from .serializers import ConversationSerializer, MessageSerializer, MinimalUserSerializer
from .pagination import MessagePagination
from django.contrib.auth.models import User
from users.models import Profile
from django.db.models import Q, Exists, OuterRef
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger("django")

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get all threads for the user
            threads = Thread.objects.filter(users=request.user)

            # Build a list of thread metadata with safe timestamp handling
            threads_list = []
            for thread in threads:
                # Get the last message in the thread
                last_message = thread.last_message()

                # Check if current user has unread messages in this thread
                unread_count = Message.objects.filter(
                    thread=thread
                ).exclude(sender=request.user).exclude(read_by=request.user).count()

                threads_list.append({
                    'thread': thread,
                    'last_message_timestamp': last_message.timestamp if last_message else thread.updated,
                    'unread_count': unread_count
                })

            # Sort ONLY by most recent message timestamp (descending)
            # Use safe fallback if timestamp is None
            threads_list.sort(
                key=lambda x: -(x['last_message_timestamp'].timestamp() if x['last_message_timestamp'] else 0)
            )

            # Extract just the threads
            sorted_threads = [item['thread'] for item in threads_list]

            # Attempt to serialize each thread individually so we can log and skip failures
            results = []
            errors = []
            for thread in sorted_threads:
                try:
                    ser = ConversationSerializer(thread, many=False, context={'request': request})
                    results.append(ser.data)
                except Exception as ex:
                    logger.exception(f"Failed to serialize thread {getattr(thread, 'id', 'unknown')}")
                    errors.append({'thread_id': getattr(thread, 'id', None), 'error': str(ex)})

            # If nothing serialized successfully, return 500 with errors for debugging
            if not results:
                logger.error("No conversations serialized successfully", extra={'errors': errors})
                return Response({'error': 'Failed to serialize conversations', 'details': errors}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Return partial results and include any thread-level errors for visibility
            response_payload = {'conversations': results}
            if errors:
                response_payload['errors'] = errors

            return Response(response_payload)

        except Exception as e:
            logger.exception("Failed to load conversations")
            # Provide minimal debug info in development; hide details in production
            detail = str(e) if getattr(__import__('os'), 'environ', {}).get('DJANGO_DEBUG', 'False') == 'True' else 'Internal server error'
            return Response({'error': 'Failed to load conversations', 'detail': detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
            
            # Don't update thread.updated timestamp when marking as read
            # Updating it causes the thread to be re-sorted, which causes the UI to jump
            
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
            
class SendFirstMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user_id = request.data.get("user_id")
            text = request.data.get("text")

            if not user_id or not text:
                return Response({"error": "user_id and text are required"}, status=400)

            try:
                other_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=404)

            # Tạo hoặc lấy Thread between two users
            # Check if a thread already exists between these two users
            thread = Thread.objects.filter(users=request.user).filter(users=other_user).first()
            
            if not thread:
                # Create new thread if it doesn't exist
                thread = Thread.objects.create()
                thread.users.add(request.user, other_user)

            # Tạo message
            message = Message.objects.create(thread=thread, sender=request.user, text=text)

            # Gửi WebSocket message
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"chat_{thread.id}",
                    {
                        "type": "chat_message",
                        "message": message.text,
                        "message_id": message.id,
                        "sender_id": request.user.id,
                        "sender_username": request.user.username,
                        "timestamp": str(message.timestamp),
                    }
                )
            except Exception as e:
                # Log websocket error but don't fail the request
                print(f"WebSocket error: {e}")

            # Trả thêm thông tin người kia (partner)
            partner, created = Profile.objects.get_or_create(user=other_user)
            partner_data = MinimalUserSerializer(partner, context={"request": request}).data

            return Response({
                "thread_id": thread.id,
                "message_id": message.id,
                "partner": partner_data,
            }, status=201)
            
        except Exception as e:
            print(f"Error in SendFirstMessageView: {e}")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendMessageWithFileView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_exempt)
    def post(self, request, thread_id):
        try:
            # Check if thread exists and user is participant
            thread = Thread.objects.filter(id=thread_id, users=request.user).first()
            if not thread:
                return Response(
                    {"error": "Thread not found or you don't have access"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get text (optional), image and file (optional)
            text = request.data.get('text', '')
            image = request.FILES.get('image')
            file = request.FILES.get('file')
            
            # At least one of text, image, or file must be present
            if not text and not image and not file:
                return Response(
                    {"error": "Message must contain text, image, or file"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create message
            message = Message.objects.create(
                thread=thread,
                sender=request.user,
                text=text if text else None
            )
            
            # Attach image if provided
            if image:
                message.image = image
            
            # Attach file if provided
            if file:
                message.file = file
            
            message.save()
            
            # Mark message as read by sender (same as text messages)
            message.read_by.add(request.user)
            
            # Serialize and return
            serializer = MessageSerializer(message, context={'request': request})
            
            # Broadcast via WebSocket
            try:
                channel_layer = get_channel_layer()

                # Build absolute URLs for saved image/file (use message fields after save)
                image_url = None
                file_info = None
                try:
                    if message.image:
                        image_url = request.build_absolute_uri(message.image.url)
                except Exception:
                    image_url = None

                try:
                    if message.file:
                        file_info = {
                            'url': request.build_absolute_uri(message.file.url),
                            'name': message.file.name.split('/')[-1]
                        }
                except Exception:
                    file_info = None

                async_to_sync(channel_layer.group_send)(
                    f"chat_{thread.id}",
                    {
                        "type": "chat_message",
                        "message": text if text else ("[Image]" if image_url else (f"[File: {file_info['name']}]" if file_info else "")),
                        "image": image_url,
                        "file": file_info,
                        "message_id": message.id,
                        "sender": request.user.username,
                        "sender_id": request.user.id,
                        "timestamp": str(message.timestamp),
                    }
                )
                # Also send a conversation list update to each participant so
                # the conversations sidebar updates in real-time (matching ChatConsumer.receive behavior)
                users = thread.users.all()
                for u in users:
                    try:
                        unread_count = Message.objects.filter(thread=thread).exclude(sender=u).exclude(read_by=u).count()
                        async_to_sync(channel_layer.group_send)(
                            f"conversations_{u.id}",
                            {
                                "type": "chat_update",
                                "chat_id": thread.id,
                                "message": text if text else ("[Image]" if image_url else (f"[File: {file_info['name']}]" if file_info else "")),
                                "image": image_url,
                                "file": file_info,
                                "sender": {
                                    "username": request.user.username,
                                    "avatar": getattr(getattr(request.user, 'profile', None), 'avatar', None).url if getattr(getattr(request.user, 'profile', None), 'avatar', None) else None,
                                    "id": request.user.id
                                },
                                "timestamp": str(message.timestamp),
                                "is_sender": u.id == request.user.id,
                                "unread_count": unread_count
                            }
                        )
                    except Exception as e:
                        print(f"Failed to send conversation update to user {u.id}: {e}")
            except Exception as e:
                print(f"WebSocket error: {e}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error in SendMessageWithFileView: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DeleteThreadView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, thread_id):
        try:
            thread = Thread.objects.filter(id=thread_id, users=request.user).first()
            if not thread:
                return Response({"error": "Thread not found or you don't have access"}, status=status.HTTP_404_NOT_FOUND)

            # Collect user IDs for notifications before deletion
            users = list(thread.users.all())
            thread_id_val = thread.id
            thread.delete()

            # Notify each participant that the thread was removed
            try:
                channel_layer = get_channel_layer()
                for u in users:
                    async_to_sync(channel_layer.group_send)(
                        f"conversations_{u.id}",
                        {
                            "type": "chat_removed",
                            "chat_id": thread_id_val,
                        }
                    )
            except Exception as e:
                print(f"Failed to notify participants about deleted thread: {e}")

            return Response({"status": "deleted", "thread_id": thread_id_val}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error deleting thread {thread_id}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)