from django.db import models
from django.contrib.auth.models import User
from django.db.models.base import Model
from django.db.models.fields import DateField
from django.db.models.signals import post_save
from django.utils import timezone
from django.templatetags.static import static

from posts.models import Post, BaseModel
import PIL 
from PIL import Image
import uuid
import os

# Create your models here.

# Uploading user files to a specific directory
def user_directory_path(instance, filename):
    """
    Function to return the path where to upload user files
    """
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class Profile(BaseModel):
    """
    Profile model for storing user profile information
    """
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=400, null=True, blank=True)
    location = models.CharField(max_length=200, null=True, blank=True)
    url = models.URLField(max_length=200, null=True, blank=True)
    bio = models.CharField(max_length=200, null=True, blank=True)
    created = models.DateField(auto_now_add=True)
    image = models.ImageField(upload_to=user_directory_path, blank=True, null=True, verbose_name='Picture')
    favourite = models.ManyToManyField(Post, blank=True)
    
    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'
        ordering = ['-created']
    
    def __str__(self):
        return f'{self.user.username} - Profile'
    
    def save(self, *args, **kwargs):
        """
        Override save method to resize profile image
        """
        super().save(*args, **kwargs)
        
        if self.image and os.path.exists(self.image.path):
            img = Image.open(self.image.path)
            if img.height > 300 or img.width > 300: 
                output_size = (300, 300)
                img.thumbnail(output_size)
                img.save(self.image.path)
    @property
    def get_full_name(self):
        """
        Return the user's full name
        """
        if self.full_name:
            return self.full_name
        # Fallback to username if no full name is provided
        return self.user.username
    
    @property
    def get_image(self):
        """
        Return the profile image URL
        """
        if self.image:
            return self.image.url
        return static('images/default.jpg')
    
    @property
    def get_post_count(self):
        """
        Return the number of posts created by the user
        """
        return Post.objects.filter(user=self.user).count()
    
    @property
    def get_following_count(self):
        """
        Return the number of users that the user is following
        """
        from posts.models import Follow
        return Follow.objects.filter(follower=self.user).count()
    
    @property
    def get_follower_count(self):
        """
        Return the number of users following the user
        """
        from posts.models import Follow
        return Follow.objects.filter(following=self.user).count()
    
    @property
    def get_favourites(self):
        """
        Return the posts that the user has marked as favorites
        """
        return self.favourite.all()
    
    @property
    def get_favourites_count(self):
        """
        Return the number of posts marked as favorites
        """
        return self.favourite.count()

def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal handler to create a profile when a new user is created
    """
    if created:
        Profile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    """
    Signal handler to save profile when user is saved
    """
    try:
        instance.profile.save()
    except User.profile.RelatedObjectDoesNotExist:
        # Profile doesn't exist yet, create one
        Profile.objects.create(user=instance)

# Connect signals
post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)
    