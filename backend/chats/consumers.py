from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Message, Thread
from asgiref.sync import sync_to_async
from django.utils.timezone import localtime
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth.models import User

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
        await self.mark_messages_as_read(user)

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
        message.read_by.add(user)
        avatar = getattr(getattr(user, "profile", None), "avatar", None)
        return {
            "id": message.id,
            "text": message.text,
            "time": localtime(message.timestamp).strftime("%I:%M %p").lstrip("0"),
            "sender": user.username,
            "sender_avatar": avatar.url if avatar else None,
            "timestamp": localtime(message.timestamp).isoformat(),
            "sender_id": user.id,  # This is important for identifying who sent the message
            "read_by_ids": [user.id],
        }

    @sync_to_async
    def get_thread_users(self):
        return list(Thread.objects.get(id=self.thread_id).users.all())

    @sync_to_async
    def get_unread_messages(self, user):
        return list(
            Message.objects.filter(
                thread_id=self.thread_id
            ).exclude(sender=user).exclude(read_by=user)
        )

    @sync_to_async
    def get_unread_count(self, thread_id, user):
        return Message.objects.filter(
            thread_id=thread_id
        ).exclude(sender=user).exclude(read_by=user).count()

    async def mark_messages_as_read(self, user):
        unread_messages = await self.get_unread_messages(user)
        logger.info(f"Marking {len(unread_messages)} messages as read by user {user.id}")
        
        # Instagram-style: Only send one read receipt for the latest message
        # This improves performance and better matches Instagram behavior
        latest_message_id = 0
        
        for message in unread_messages:
            await sync_to_async(message.read_by.add)(user)
            logger.info(f"Message {message.id} marked as read by user {user.id}")
            if message.id > latest_message_id:
                latest_message_id = message.id
        
        # Only send one read receipt for the latest message
        # This will cause the frontend to mark all messages as read up to this point
        if latest_message_id > 0:
            logger.info(f"Sending read receipt for latest message {latest_message_id}")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "read_receipt",
                    "message_id": latest_message_id,
                    "reader_id": user.id,
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        user = self.scope['user']

        if data.get("type") == "mark_read":
            logger.info(f"User {user.id} ({user.username}) marking messages as read in thread {self.thread_id}")
            await self.mark_messages_as_read(user)
            
            # Send a mark_read update to the conversation list consumer
            # This will update the conversation list UI in real-time
            thread_users = await self.get_thread_users()
            for u in thread_users:
                unread_count = await self.get_unread_count(self.thread_id, u)
                await self.channel_layer.group_send(
                    f"conversations_{u.id}",
                    {
                        "type": "mark_read_update",
                        "chat_id": self.thread_id,
                        "unread_count": unread_count,
                        "reader_id": user.id,
                    }
                )
            return

        text = data.get("text", "").strip()
        if not text:
            return

        payload = await self.save_message(user, text)
        payload["readByIds"] = payload.pop("read_by_ids")  # Fix naming for frontend

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                **payload,
            }
        )

        users = await self.get_thread_users()
        for u in users:
            unread_count = await self.get_unread_count(self.thread_id, u)

            await self.channel_layer.group_send(
                f"conversations_{u.id}",
                {
                    "type": "chat_update",
                    "chat_id": self.thread_id,
                    "message": payload["text"],
                    "sender": {
                        "username": user.username,
                        "avatar": payload["sender_avatar"],
                        "id": user.id
                    },
                    "timestamp": payload["timestamp"],
                    "is_sender": u.id == user.id,
                    "unread_count": unread_count
                }
            )

    async def chat_message(self, event):
        user = self.scope['user']
        is_own = user.username == event.get('sender') if user and not isinstance(user, AnonymousUser) else False
        
        # Make sure sender_id is included and preserved
        if 'sender_id' not in event:
            # Try to find sender_id if it's missing
            sender_username = event.get('sender')
            if sender_username:
                try:
                    sender = await sync_to_async(User.objects.get)(username=sender_username)
                    event['sender_id'] = sender.id
                except Exception as e:
                    logger.error(f"Failed to get sender_id: {e}")
        
        await self.send(text_data=json.dumps({**event, "isOwn": is_own}))

    async def read_receipt(self, event):
        logger.info(f"Sending read receipt: message {event['message_id']} read by user {event['reader_id']}")
        await self.send(text_data=json.dumps({
            "type": "read_receipt",
            "message_id": event["message_id"],
            "reader_id": event["reader_id"]
        }))



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

    async def mark_read_update(self, event):
        """Handle mark_read updates from chat consumer"""
        try:
            await self.send(text_data=json.dumps({
                "type": "mark_read_update",
                "chat_id": event["chat_id"],
                "unread_count": event["unread_count"],
                "reader_id": event["reader_id"]
            }))
        except Exception as e:
            logger.error(f"ConversationConsumer mark_read_update error: {str(e)}")

    async def chat_update(self, event):
        try:
            await self.send(text_data=json.dumps(event))
        except Exception as e:
            logger.error(f"ConversationConsumer chat_update error: {str(e)}")