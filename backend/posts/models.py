from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.utils.text import slugify
from django.urls import reverse
import uuid
from datetime import datetime

# Create your models here.

# Uploading user files to a specific directory
def user_directory_path(instance, filename):
    """
    Function to return the path where to upload user files
    """
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class BaseModel(models.Model): # abstract base class
    """
    Base model with common fields and methods
    """
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        abstract = True
        
    def to_dict(self):
        """Convert model instance to dictionary"""
        return {field.name: getattr(self, field.name) for field in self._meta.fields}

class Tag(BaseModel):
    """
    Model for post tags
    """
    title = models.CharField(max_length=100, verbose_name='Tag')
    slug = models.SlugField(null=False, unique=True, default=uuid.uuid1)
    
    class Meta:
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['title']
    
    def get_absolute_url(self):
        """
        Return the URL for the tag detail page
        """
        return reverse("tags", args=[self.slug])
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """
        Override save method to create slug from title
        """
        if not self.slug:
            self.slug = slugify(self.title)
        return super().save(*args, **kwargs)
    
class Post(BaseModel):
    """
    Model for user posts
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    picture = models.ImageField(upload_to=user_directory_path, verbose_name="Picture", null=True)
    caption = models.TextField(verbose_name="caption", null=True, blank=True)
    posted = models.DateField(auto_now_add=True)
    tags = models.ManyToManyField(Tag, related_name="tags")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    likes = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'
        ordering = ['-posted']
    
    def get_absolute_url(self):
        """
        Return the URL for the post detail page
        """
        return reverse("post-details", args=[str(self.id)])
    
    def __str__(self):
        return f'{self.user.username} - {self.caption[:20]}...' if self.caption else f'{self.user.username} - No Caption'
    
    @property
    def get_like_count(self):
        """
        Return the number of likes for the post
        """
        return self.likes
    
    @property
    def get_comments(self):
        """
        Return all comments for the post
        """
        from comments.models import Comment
        return Comment.objects.filter(post=self).order_by('-created_at')
    
    @property
    def get_comment_count(self):
        """
        Return the number of comments for the post
        """
        from comments.models import Comment
        return Comment.objects.filter(post=self).count()

class Follow(BaseModel):
    """
    Model for user follow relationships
    """
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follower")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    
    class Meta:
        verbose_name = 'Follow'
        verbose_name_plural = 'Follows'
        unique_together = ('follower', 'following')
    
    def __str__(self):
        return f'{self.follower.username} follows {self.following.username}'
    
    def save(self, *args, **kwargs):
        """
        Override save method to prevent users from following themselves
        """
        if self.follower == self.following:
            raise ValueError("Users cannot follow themselves")
        super().save(*args, **kwargs)

class Stream(BaseModel):
    """
    Model for user streams (posts from users they follow)
    """
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stream_following")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="steam_user")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True)
    date = models.DateTimeField()
    
    class Meta:
        verbose_name = 'Stream'
        verbose_name_plural = 'Streams'
        ordering = ['-date']
    
    def __str__(self):
        return f'{self.user.username} - Stream Item'
    
    @classmethod
    def add_post(cls, sender, instance, *args, **kwargs):
        """
        Signal handler to add a post to the streams of followers
        """
        post = instance
        user = post.user
        followers = Follow.objects.all().filter(following=user)
        for follower in followers:
            stream = Stream(post=post, user=follower.follower, date=post.posted, following=user)
            stream.save()
    
class Likes(BaseModel):
    """
    Model for post likes
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post_likes")
    
    class Meta:
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'
        unique_together = ('user', 'post')
    
    def __str__(self):
        return f'{self.user.username} likes {self.post.id}'
    
    def save(self, *args, **kwargs):
        """
        Override save method to update post like count
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Only increment like count if this is a new like
        if is_new:
            post = self.post
            post.likes += 1
            post.save()
    
    def delete(self, *args, **kwargs):
        """
        Override delete method to update post like count
        """
        post = self.post
        post.likes -= 1
        post.save()
        super().delete(*args, **kwargs)
            
# Connect the signal
post_save.connect(Stream.add_post, sender=Post)
        