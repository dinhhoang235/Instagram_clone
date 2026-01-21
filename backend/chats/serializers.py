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
    image = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'text', 'image', 'file', 'time', 'isOwn', 'readByIds']

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
    
    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def get_file(self, obj):
        if obj.file:
            return {
                'url': obj.file.url,
                'name': obj.file.name.split('/')[-1]
            }
        return None

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
        other = self.get_other_user(obj)
        return other.username if other else "Unknown"

    def get_fullName(self, obj):
        other_user = self.get_other_user(obj)
        if other_user and hasattr(other_user, 'profile') and other_user.profile.full_name:
            return other_user.profile.full_name
        return other_user.username if other_user else "Unknown"

    def get_short_name(self, obj):
        """Return the last word of the other user's full name (or username)."""
        full = self.get_fullName(obj) or "Người dùng"
        parts = full.strip().split()
        return parts[-1] if parts else full

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
        # If the last message contains an image or file, show a friendly preview
        if getattr(last, 'image', None):
            verb = 'sent a photo.'
            if current_user and last.sender == current_user:
                return f"You {verb}"
            return f"{self.get_short_name(obj)} {verb}"

        if getattr(last, 'file', None):
            verb = 'sent a file.'
            if current_user and last.sender == current_user:
                return f"You {verb}"
            return f"{self.get_short_name(obj)} {verb}"

        # Fallback to text if present
        if last.text:
            if current_user and last.sender == current_user:
                return f"You: {last.text}"
            return last.text

        # Default fallback when no text/image/file
        if current_user and last.sender == current_user:
            return "You sent a file"
        return f"{self.get_short_name(obj)} sent a file."

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
        """Return True if the other user is currently online (based on presence cache)."""
        try:
            other = self.get_other_user(obj)
            if not other:
                return False
            from users.presence import is_user_online
            return is_user_online(other.id)
        except Exception as e:
            # Fallback to False on any error
            return False
        
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