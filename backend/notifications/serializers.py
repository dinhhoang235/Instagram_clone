from rest_framework import serializers
from notifications.models import Notification
from django.contrib.auth.models import User

class NotificationUserSerializer(serializers.ModelSerializer):
    """Serializer for user information in notifications"""
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image']
    
    def get_profile_image(self, obj):
        request = self.context.get('request')
        if hasattr(obj, 'profile') and obj.profile.image:
            url = obj.profile.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

class NotificationSerializer(serializers.ModelSerializer):
    sender_details = serializers.SerializerMethodField()
    notification_type_display = serializers.SerializerMethodField()
    post_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'sender', 'user', 'notification_type', 'notification_type_display',
            'text_preview', 'date', 'is_seen', 'sender_details', 'post_id'
        ]
        read_only_fields = ['id', 'date']
    
    def get_sender_details(self, obj):
        request = self.context.get('request')
        serializer = NotificationUserSerializer(obj.sender, context={'request': request})
        return serializer.data

    
    def get_notification_type_display(self, obj):
        return obj.get_notification_type_display()
    
    def get_post_id(self, obj):
        if obj.post:
            return str(obj.post.id)
        return None
