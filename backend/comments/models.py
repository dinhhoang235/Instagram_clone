from django.db import models
from django.contrib.auth.models import User

from posts.models import Post, BaseModel

class Comment(BaseModel):
    """
    Model for storing post comments
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
        ordering = ['-date']
    
    def __str__(self):
        return f'{self.user.username} - Comment on {self.post.id}'
    
    @property
    def get_user_username(self):
        """
        Return the username of the comment author
        """
        return self.user.username
    
    @property
    def is_owner(self, user):
        """
        Check if the given user is the owner of this comment
        """
        return self.user == user
    