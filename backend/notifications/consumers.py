from channels.generic.websocket import AsyncJsonWebsocketConsumer
import logging

logger = logging.getLogger("django")

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        logger.info(f"Notification WebSocket connect attempt from user: {user}")
        
        if user.is_anonymous:
            logger.warning("Anonymous user attempted to connect to notifications WebSocket")
            await self.close()
        else:
            self.group_name = f"user_{user.id}"
            logger.info(f"Adding user {user.id} to notification group: {self.group_name}")
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f"Notification WebSocket connected for user {user.id} ({user.username})")

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            logger.info(f"Disconnecting user from notification group: {self.group_name}")
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        else:
            logger.info("Notification WebSocket disconnected (no group)")

    async def send_notification(self, event):
        logger.info(f"Sending notification: {event.get('notification', {}).get('type', 'unknown')}")
        await self.send_json(event["notification"])
