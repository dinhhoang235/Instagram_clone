from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Follow
from notifications.models import Notification

@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    if created:
        if instance.follower != instance.following:
            Notification.objects.create(
                sender=instance.follower,
                recipient=instance.following,
                type='follow',
                content='started following you',
            )