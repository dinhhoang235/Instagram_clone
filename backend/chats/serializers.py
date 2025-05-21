from rest_framework import serializers
from chats.models import Message
from django.contrib.auth.models import User

class MessageUserSerializer(serializers.ModelSerializer):
    """Serializer for nested user information in messages"""
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image']
    
    def get_profile_image(self, obj):
        if hasattr(obj, 'profile') and obj.profile.image:
            return obj.profile.image.url
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender_details = serializers.SerializerMethodField()
    recipient_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'user', 'sender', 'recipient', 'body', 'date', 'is_read', 
                  'sender_details', 'recipient_details']
        read_only_fields = ['id', 'user', 'date']
    
    def get_sender_details(self, obj):
        return MessageUserSerializer(obj.sender).data
    
    def get_recipient_details(self, obj):
        return MessageUserSerializer(obj.recipient).data
    
    def create(self, validated_data):
        # Use the class method to ensure both sides of the conversation are updated
        sender = self.context['request'].user
        recipient = validated_data.get('recipient')
        body = validated_data.get('body')
        
        return Message.send_message(sender, recipient, body)

class MessageThreadSerializer(serializers.Serializer):
    """Serializer for message thread summaries"""
    user = MessageUserSerializer()
    last = serializers.DateTimeField()
    unread = serializers.IntegerField()
    last_message = serializers.SerializerMethodField()
    
    def get_last_message(self, obj):
        user = self.context['request'].user
        other_user = obj['user']
        
        # Get the most recent message between these users
        message = Message.objects.filter(
            user=user,
            recipient=other_user
        ).order_by('-date').first()
        
        if message:
            return {
                'body': message.body,
                'date': message.date,
                'is_read': message.is_read
            }
        return None
