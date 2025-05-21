from django.db import models
from django.contrib.auth.models import User
from posts.models import BaseModel

class Notification(BaseModel):
    """
    Model for user notifications
    """
    # Define notification types as class constants
    LIKE = 1
    COMMENT = 2
    FOLLOW = 3
    
    NOTIFICATION_TYPES = (
        (LIKE, 'Like'),
        (COMMENT, 'Comment'),
        (FOLLOW, 'Follow')
    )

    post = models.ForeignKey("posts.Post", on_delete=models.CASCADE, related_name="notification_post", null=True, blank=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notification_from_user")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notification_to_user")
    notification_type = models.IntegerField(choices=NOTIFICATION_TYPES)
    text_preview = models.CharField(max_length=100, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    is_seen = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} notification from {self.sender.username} to {self.user.username}"
    
    @property
    def get_sender_username(self):
        """
        Return the username of the notification sender
        """
        return self.sender.username
    
    @property
    def get_sender_profile_image(self):
        """
        Return the profile image of the notification sender
        """
        if hasattr(self.sender, 'profile') and self.sender.profile.image:
            return self.sender.profile.image.url
        return None
    
    @classmethod
    def create_notification(cls, sender, user, notification_type, post=None, text_preview=""):
        """
        Create a new notification
        
        Args:
            sender: The user creating the notification
            user: The user receiving the notification
            notification_type: The type of notification (LIKE, COMMENT, FOLLOW)
            post: Optional post associated with the notification
            text_preview: Optional text preview for the notification
            
        Returns:
            The created notification instance
        """
        if sender == user:
            return None  # Don't notify users about their own actions
            
        notification = cls(
            post=post,
            sender=sender,
            user=user,
            notification_type=notification_type,
            text_preview=text_preview
        )
        notification.save()
        return notification
    
    @classmethod
    def mark_as_seen(cls, user):
        """
        Mark all notifications for a user as seen
        
        Args:
            user: The user whose notifications should be marked as seen
        """
        cls.objects.filter(user=user, is_seen=False).update(is_seen=True)