from django.db import models
from django.contrib.auth.models import User
from django.db.models import Max
from posts.models import BaseModel

class Message(BaseModel):
    """
    Model for user direct messages
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="from_user")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="to_user")
    body = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['-date']
    
    def __str__(self):
        return f'Message from {self.sender.username} to {self.recipient.username}'
    
    @classmethod
    def send_message(cls, from_user, to_user, body):
        """
        Send a message from one user to another
        
        Args:
            from_user: The sender of the message
            to_user: The recipient of the message
            body: The message content
            
        Returns:
            The created sender message instance
        """
        # Sender's copy of the message
        sender_message = cls(
            user=from_user,
            sender=from_user,
            recipient=to_user,
            body=body,
            is_read=True  # Message is read for the sender
        )
        sender_message.save()
        
        # Recipient's copy of the message
        recipient_message = cls(
            user=to_user,
            sender=from_user,
            recipient=from_user,
            body=body,
            is_read=False  # Message is unread for the recipient
        )
        recipient_message.save()
        
        return sender_message
    
    @classmethod
    def get_messages(cls, user):
        """
        Get all message threads for a user
        
        Args:
            user: The user to get messages for
            
        Returns:
            A list of dictionaries containing message thread information
        """
        users = []
        # Get all threads with the most recent message first
        messages = cls.objects.filter(user=user).values("recipient").annotate(
            last=Max('date')
        ).order_by("-last")
        
        for message in messages:
            users.append({
                'user': User.objects.get(pk=message['recipient']),
                'last': message['last'],
                'unread': cls.objects.filter(
                    user=user,
                    recipient__pk=message['recipient'],
                    is_read=False
                ).count(),
            })
        return users
    
    @classmethod
    def get_conversation(cls, user1, user2):
        """
        Get the conversation between two users
        
        Args:
            user1: First user in the conversation
            user2: Second user in the conversation
            
        Returns:
            QuerySet of messages between the two users
        """
        return cls.objects.filter(
            user=user1,
            recipient=user2
        ).order_by('date')
    
    @classmethod
    def mark_as_read(cls, user, sender):
        """
        Mark all messages from a specific sender as read
        
        Args:
            user: The recipient user
            sender: The sender user
        """
        messages = cls.objects.filter(
            user=user,
            sender=sender,
            is_read=False
        )
        for message in messages:
            message.is_read = True
            message.save()