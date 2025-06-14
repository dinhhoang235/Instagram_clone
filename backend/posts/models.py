import uuid
from django.db import models
from django.contrib.auth.models import User
from PIL import Image
import os

def user_directory_path(instance, filename):
    return f'user_{instance.user.id}/posts/{filename}'

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=user_directory_path, null=False, blank=True)
    caption = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    posted = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    class Meta:
        ordering = ['-posted']

    def __str__(self):
        return f"{self.user.username}'s Post"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.image and os.path.exists(self.image.path):
            img = Image.open(self.image.path)
            if img.height > 600 or img.width > 600:
                output_size = (600, 600)
                img.thumbnail(output_size)
                img.save(self.image.path)

    @property
    def comments_count(self):
        return self.comments.count()

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def time_ago(self):
        from django.utils.timesince import timesince
        return timesince(self.posted) + " ago"

class Tag(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='tags', null=True, blank=True)
    name = models.CharField(max_length=100, default='untitled')

    def __str__(self):
        return self.name
