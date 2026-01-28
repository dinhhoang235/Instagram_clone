import uuid
import os
import re
from PIL import Image
from django.db import models
from django.contrib.auth.models import User
from django.utils.timesince import timesince

def user_directory_path(instance, filename):
    """Return upload path for images.

    Supports both Post (has .user) and PostImage (has .post which has .user).
    """
    try:
        # Post instance
        user_id = instance.user.id
    except Exception:
        try:
            # PostImage instance
            user_id = instance.post.user.id
        except Exception:
            user_id = 'unknown'

    return f'user_{user_id}/posts/{filename}'

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=user_directory_path, null=False, blank=True)
    caption = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    posted = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    # privacy / controls
    hide_likes = models.BooleanField(default=False)
    disable_comments = models.BooleanField(default=False)
    
    tags = models.ManyToManyField("Tag", through="PostTag", related_name="posts")

    class Meta:
        ordering = ['-posted']

    def __str__(self):
        return f"{self.user.username}'s Post"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)

        # Resize ảnh
        if self.image and os.path.exists(self.image.path):
            img = Image.open(self.image.path)
            if img.height > 600 or img.width > 600:
                img.thumbnail((600, 600))
                img.save(self.image.path)

        # Tạo tag từ caption nếu là bài viết mới
        if is_new and self.caption:
            hashtags = re.findall(r"#([\wÀ-ỹ_]+)", self.caption or "")
            for tag in set(hashtags):
                tag_obj, _ = Tag.objects.get_or_create(name=tag.lower())
                PostTag.objects.get_or_create(post=self, tag=tag_obj)

    @property
    def comments_count(self):
        return self.comments.count()

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def time_ago(self):
        return timesince(self.posted) + " ago"

class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"#{self.name}"
    
class PostTag(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("post", "tag")  # tránh gán trùng tag cho 1 post


class PostImage(models.Model):
    post = models.ForeignKey(Post, related_name='post_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=user_directory_path)
    order = models.PositiveIntegerField(default=0)
    alt_text = models.CharField(max_length=1024, blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.post.id} ({self.order})"
