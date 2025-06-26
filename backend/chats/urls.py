from django.urls import path
from .views import ConversationListView, ThreadMessageListView, MarkThreadAsReadView, SendFirstMessageView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('threads/<int:thread_id>/messages/', ThreadMessageListView.as_view(), name='thread-messages'),
    path('threads/<int:thread_id>/mark-read/', MarkThreadAsReadView.as_view(), name='mark-thread-read'),
    path("start/", SendFirstMessageView.as_view(), name="send-first"),
]