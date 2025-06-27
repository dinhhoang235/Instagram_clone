from .models import Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import NotificationSerializer

def create_notification(sender, recipient, type, post=None, content=""):
    if sender == recipient:
        return None  # tránh tự gửi cho chính mình

    # 1. Tạo notification DB
    notification = Notification.objects.create(
        sender=sender,
        recipient=recipient,
        type=type,
        post=post,
        content=content,
    )

    # 2. Gửi realtime qua WebSocket
    try:
        channel_layer = get_channel_layer()
        
        # Create a simple mock request with the recipient as the user for proper context
        class MockRequest:
            def __init__(self, user):
                self.user = user
                self.META = {'HTTP_HOST': 'localhost:8000', 'wsgi.url_scheme': 'http'}
            
            def build_absolute_uri(self, location):
                return f"http://localhost:8000{location}"
        
        request = MockRequest(recipient)
        serializer = NotificationSerializer(notification, context={'request': request})
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}",
            {
                "type": "send.notification",
                "notification": serializer.data
            }
        )
    except Exception as e:
        print(f"Error sending notification: {e}")  # for debugging
        pass  # fallback nếu không có channel layer (trong test)

    return notification
