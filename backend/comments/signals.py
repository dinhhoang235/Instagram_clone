import re
from django.db.models.signals import post_save ,post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from comments.models import Comment
from notifications.models import Notification
from notifications.utils import create_notification

@receiver(post_save, sender=Comment)
def create_comment_notification(sender, instance, created, **kwargs):
    create_notification(
        sender=instance.user,
        recipient=instance.post.user,
        type='comment',
        post=instance.post,
        content=f'commented: "{instance.text[:30]}"',
    )

@receiver(post_save, sender=Comment)
def create_mention_notification(sender, instance, created, **kwargs):
    if not created:
        return

    mentioned_usernames = re.findall(r'@(\w+)', instance.text or "")
    for username in mentioned_usernames:
        try:
            mentioned_user = User.objects.get(username=username)
            create_notification(
                sender=instance.user,
                recipient=mentioned_user,
                type='mention',
                post=instance.post,
                content="mentioned you in a comment",
            )
        except User.DoesNotExist:
            continue

@receiver(post_delete, sender=Comment)
def delete_comment_notifications(sender, instance, **kwargs):
    Notification.objects.filter(
        post=instance.post,
        sender=instance.user,
        type__in=['comment', 'mention']
    ).delete()
