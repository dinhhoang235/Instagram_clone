from django.db import models
from django.contrib.auth.models import User
from django.templatetags.static import static
from posts.models import Post
from PIL import Image
import os

GENDER = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
]

ALLOW_CHOICES = [
    ('everyone', 'Everyone'),
    ('followers', 'Followers'),
    ('no_one', 'No one'),
]

def user_directory_path(instance, filename):
    return f'user_{instance.user.id}/{filename}'

class Profile(models.Model):
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=400, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    bio = models.CharField(max_length=200, null=True, blank=True)
    avatar = models.ImageField(upload_to=user_directory_path, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER, blank=True, default='other')

    is_private = models.BooleanField(default=False)
    allow_tagging = models.BooleanField(default=True)
    show_activity = models.BooleanField(default=True)
    allow_story_resharing = models.BooleanField(default=True)
    allow_comments = models.CharField(max_length=20, choices=ALLOW_CHOICES, default='everyone')
    allow_messages = models.CharField(max_length=20, choices=ALLOW_CHOICES, default='everyone')

    # When the user was last seen offline (updated when all WebSocket connections disconnect)
    last_seen = models.DateTimeField(null=True, blank=True, help_text="Last time the user was seen online")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.avatar and os.path.exists(self.avatar.path):
            img = Image.open(self.avatar.path)
            if img.height > 300 or img.width > 300:
                img.thumbnail((300, 300))
                img.save(self.avatar.path)

    def __str__(self):
        return self.user.username

    @property
    def get_avatar(self):
        if self.avatar:
            return self.avatar.url
        return static('images/default.jpg')

    @property
    def get_post_count(self):
        return Post.objects.filter(user=self.user).count()

    @property
    def get_follower_count(self):
        return self.user.followers.count()

    @property
    def get_following_count(self):
        return self.user.following.count()
    
    def is_self(self, request_user):
        return self.user == request_user
    
    def is_following(self, request_user):
        if not request_user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request_user, following=self.user).exists()


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    followed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"
