from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Match both with and without trailing slash for better compatibility
    re_path(r'ws/chat/(?P<thread_id>\d+)/?', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/conversations/?', consumers.ConversationConsumer.as_asgi()),
]
