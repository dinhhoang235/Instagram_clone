from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Thread, Message
from .serializers import ConversationSerializer, MessageSerializer
from .pagination import MessagePagination 

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        threads = Thread.objects.filter(users=request.user).order_by('-updated')
        serializer = ConversationSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)

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