from rest_framework import serializers
from .models import Thread, Message
from django.utils import timezone
from users.models import Profile

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    sender_id = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    isOwn = serializers.SerializerMethodField()
    readByIds = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'text', 'time', 'isOwn', 'readByIds']

    def get_sender(self, obj):
        return obj.sender.username
        
    def get_sender_id(self, obj):
        return obj.sender.id

    def get_isOwn(self, obj):
        request = self.context.get('request')
        return request and obj.sender == request.user
    
    def get_readByIds(self, obj):
        # Return the IDs of users who have read this message
        read_by_ids = list(obj.read_by.values_list('id', flat=True))
        print(f"Message {obj.id} readByIds: {read_by_ids}")  # Add debug log
        return read_by_ids

    def get_time(self, obj):
        local_dt = timezone.localtime(obj.timestamp) 
        return local_dt.strftime("%-I:%M %p")

class ConversationSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    online = serializers.SerializerMethodField()
    partner_id = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ['id', 'username', 'fullName', 'avatar', 'lastMessage', 'time', 'unread_count', 'online', 'partner_id']

    def get_other_user(self, obj):
        user = self.context['request'].user
        return obj.users.exclude(id=user.id).first()

    def get_username(self, obj):
        return self.get_other_user(obj).username

    def get_fullName(self, obj):
        other_user = self.get_other_user(obj)
        if other_user and hasattr(other_user, 'profile') and other_user.profile.full_name:
            return other_user.profile.full_name
        return other_user.username if other_user else "Unknown"

    def get_avatar(self, obj):
        request = self.context.get('request')
        user = self.get_other_user(obj)
        if user and hasattr(user, 'profile') and user.profile.avatar:
            return request.build_absolute_uri(user.profile.avatar.url)
        return None

    def get_lastMessage(self, obj):
        last = obj.last_message()
        if not last:
            return ""
        
        request = self.context.get('request')
        current_user = request.user if request else None
        
        # Add "You:" prefix if message is from current user
        if current_user and last.sender == current_user:
            return f"You: {last.text}"
        
        return last.text

    def get_time(self, obj):
        last = obj.last_message()
        if last and last.timestamp:
            local_dt = timezone.localtime(last.timestamp)
            return local_dt.strftime("%-I:%M %p")
        return ""

    def get_unread_count(self, obj):
        user = self.context['request'].user
        # Only count messages from other users that haven't been read by the current user
        unread_count = obj.messages.exclude(sender=user).exclude(read_by=user).count()
        print(f"Thread {obj.id}: Unread count for user {user.id} = {unread_count}")
        return unread_count

    def get_online(self, obj):
        other = self.get_other_user(obj)
        return getattr(other.profile, 'is_online', False) if other else False
        
    def get_partner_id(self, obj):
        other_user = self.get_other_user(obj)
        partner_id = other_user.id if other_user else None
        print(f"Thread {obj.id}: partner_id = {partner_id}")
        return partner_id
    
class MinimalUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username")

    class Meta:
        model = Profile
        fields = ["id", "username", "avatar"]

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else None