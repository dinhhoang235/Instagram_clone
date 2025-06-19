from django.urls import path
from .views import ConversationListView, ThreadMessageListView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('threads/<int:thread_id>/messages/', ThreadMessageListView.as_view(), name='thread-messages'),
]