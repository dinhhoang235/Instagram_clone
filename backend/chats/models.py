from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Thread(models.Model):
    users = models.ManyToManyField(User)
    updated = models.DateTimeField(auto_now=True)

    def last_message(self):
        return self.messages.order_by('-timestamp').first()


class Message(models.Model):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    read_by = models.ManyToManyField(User, related_name='read_messages', blank=True)
    
    def is_read_by(self, user):
        return self.read_by.filter(id=user.id).exists()
