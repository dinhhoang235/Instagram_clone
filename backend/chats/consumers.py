from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Message, Thread
from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser
from datetime import datetime
from django.utils.timezone import localtime


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_{self.thread_id}'

        user = self.scope["user"]
        if user.is_anonymous:
            await self.close(code=4001)  # unauthorized
            return

        # (Optional) kiểm tra user có trong thread không
        thread_exists = await sync_to_async(Thread.objects.filter(id=self.thread_id, users=user).exists)()
        if not thread_exists:
            await self.close(code=4003)  # forbidden
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @sync_to_async
    def save_message(self, user, text):
        message = Message.objects.create(
            thread_id=self.thread_id,
            sender=user,
            text=text,
        )
        
        print(">>> Raw timestamp (UTC):", message.timestamp)
        print(">>> Localtime (VN):", localtime(message.timestamp))
        return {
            "id": message.id,
            "text": message.text,
            "time": localtime(message.timestamp).strftime("%I:%M %p").lstrip("0"),  # đúng giờ VN
            "sender": user.username,
        }

    async def receive(self, text_data):
        data = json.loads(text_data)
        text = data.get("text", "").strip()
        if not text:
            return

        user = self.scope['user']
        if user.is_anonymous:
            await self.close(code=4001)
            return

        payload = await self.save_message(user, text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                **payload,
            }
        )

    async def chat_message(self, event):
        event_copy = dict(event)

        user = self.scope['user']
        if not isinstance(user, AnonymousUser):
            if user.username == event['sender']:
                event_copy['isOwn'] = True
            else:
                event_copy['isOwn'] = False
        else:
            event_copy['isOwn'] = False  # fallback cho Anonymous

        event_copy.pop("type", None)
        await self.send(text_data=json.dumps(event_copy))