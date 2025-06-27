from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Follow
from notifications.models import Notification
from notifications.utils import create_notification


@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    if created:
        create_notification(
            sender=instance.follower,
            recipient=instance.following,
            type='follow',
            content='started following you',
        )


@receiver(post_delete, sender=Follow)
def delete_follow_notification(sender, instance, **kwargs):
    Notification.objects.filter(
        sender=instance.follower,
        recipient=instance.following,
        type='follow'
    ).delete()


