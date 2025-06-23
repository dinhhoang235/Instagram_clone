from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Message, Thread
from asgiref.sync import sync_to_async
from django.utils.timezone import localtime
from django.contrib.auth.models import AnonymousUser
from datetime import datetime
import logging

logger = logging.getLogger("django")

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_{self.thread_id}'
        user = self.scope["user"]

        if user.is_anonymous:
            await self.close(code=4001)
            return

        thread_exists = await sync_to_async(Thread.objects.filter(id=self.thread_id, users=user).exists)()
        if not thread_exists:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @sync_to_async
    def save_message(self, user, text):
        message = Message.objects.create(
            thread_id=self.thread_id,
            sender=user,
            text=text,
        )
        avatar = getattr(getattr(user, "profile", None), "avatar", None)
        return {
            "id": message.id,
            "text": message.text,
            "time": localtime(message.timestamp).strftime("%I:%M %p").lstrip("0"),
            "sender": user.username,
            "sender_avatar": avatar.url if avatar else None,
            "timestamp": localtime(message.timestamp).isoformat(),
        }

    @sync_to_async
    def get_thread_users(self):
        return list(Thread.objects.get(id=self.thread_id).users.all())

    async def receive(self, text_data):
        data = json.loads(text_data)
        text = data.get("text", "").strip()
        if not text:
            return

        user = self.scope['user']
        payload = await self.save_message(user, text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                **payload,
            }
        )

        users = await self.get_thread_users()
        for u in users:
            await self.channel_layer.group_send(
                f"conversations_{u.id}",
                {
                    "type": "chat_update",
                    "chat_id": self.thread_id,
                    "message": payload["text"],
                    "sender": {
                        "username": user.username,
                        "avatar": payload["sender_avatar"]
                    },
                    "timestamp": payload["timestamp"],
                    "is_sender": u.id == user.id
                }
            )

    async def chat_message(self, event):
        user = self.scope['user']
        is_own = user.username == event.get('sender') if user and not isinstance(user, AnonymousUser) else False
        await self.send(text_data=json.dumps({ **event, "isOwn": is_own }))


class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            user = self.scope["user"]
            if user.is_anonymous:
                await self.close(code=4001)
                return

            self.room_group_name = f"conversations_{user.id}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
        except Exception as e:
            logger.error(f"ConversationConsumer connect error: {str(e)}")
            await self.close(code=4500)

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        except Exception as e:
            logger.error(f"ConversationConsumer disconnect error: {str(e)}")

    async def chat_update(self, event):
        try:
            await self.send(text_data=json.dumps(event))
        except Exception as e:
            logger.error(f"ConversationConsumer chat_update error: {str(e)}")