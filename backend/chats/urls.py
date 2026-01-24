from django.urls import path
from .views import ConversationListView, ThreadMessageListView, MarkThreadAsReadView, SendFirstMessageView, SendMessageWithFileView, DeleteThreadView, SharePostView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('threads/<int:thread_id>/messages/', ThreadMessageListView.as_view(), name='thread-messages'),
    path('threads/<int:thread_id>/mark-read/', MarkThreadAsReadView.as_view(), name='mark-thread-read'),
    path('threads/<int:thread_id>/send-file/', SendMessageWithFileView.as_view(), name='send-message-file'),
    path('threads/<int:thread_id>/share-post/', SharePostView.as_view(), name='share-post'),
    path('threads/<int:thread_id>/', DeleteThreadView.as_view(), name='delete-thread'),
    path("start/", SendFirstMessageView.as_view(), name="send-first"),
]