from rest_framework.routers import DefaultRouter

# Import ViewSets
from posts.views import PostViewSet
from users.views import UserViewSet, ProfileViewSet
from comments.views import CommentViewSet
# from chats.views import MessageViewSet
# from notifications.views import NotificationViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'users', UserViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'comments', CommentViewSet)
# router.register(r'messages', MessageViewSet)
# router.register(r'notifications', NotificationViewSet)

