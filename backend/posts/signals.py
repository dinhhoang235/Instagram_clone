import re
from django.db.models.signals import post_save, m2m_changed, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from posts.models import Post
from notifications.models import Notification
from notifications.utils import create_notification

# Tạo notification khi người dùng được tag bằng @username trong caption
@receiver(post_save, sender=Post)
def create_caption_mention_notifications(sender, instance, created, **kwargs):
    if not created:
        return

    mentioned_usernames = re.findall(r'@(\w+)', instance.caption or "")
    for username in mentioned_usernames:
        try:
            mentioned_user = User.objects.get(username=username)
            create_notification(
                sender=instance.user,
                recipient=mentioned_user,
                type='mention',
                post=instance,
                content="mentioned you in a post",
            )
        except User.DoesNotExist:
            continue

# Tạo notification khi ai đó like bài viết
@receiver(m2m_changed, sender=Post.likes.through)
def create_like_notification(sender, instance, action, pk_set, **kwargs):
    if action == 'post_add':
        for user_id in pk_set:
            try:
                user = User.objects.get(id=user_id)
                create_notification(
                    sender=user,
                    recipient=instance.user,
                    type='like',
                    post=instance,
                    content="liked your photo",
                )
            except User.DoesNotExist:
                continue

@receiver(m2m_changed, sender=Post.likes.through)
def delete_like_notification(sender, instance, action, pk_set, **kwargs):
    if action == 'post_remove':
        for user_id in pk_set:
            Notification.objects.filter(
                sender_id=user_id,
                recipient=instance.user,
                type='like',
                post=instance
            ).delete()
            
@receiver(post_delete, sender=Post)
def delete_post_notifications(sender, instance, **kwargs):
    Notification.objects.filter(post=instance).delete()