from rest_framework import serializers
from .models import Thread, Message
from django.utils import timezone

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    isOwn = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'text', 'time', 'isOwn']

    def get_sender(self, obj):
        return obj.sender.username

    def get_isOwn(self, obj):
        request = self.context.get('request')
        return request and obj.sender == request.user

    def get_time(self, obj):
        local_dt = timezone.localtime(obj.timestamp) 
        return local_dt.strftime("%-I:%M %p")

class ConversationSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()
    online = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ['id', 'username', 'avatar', 'lastMessage', 'time', 'unread', 'online']

    def get_other_user(self, obj):
        user = self.context['request'].user
        return obj.users.exclude(id=user.id).first()

    def get_username(self, obj):
        return self.get_other_user(obj).username

    def get_avatar(self, obj):
        request = self.context.get('request')
        user = self.get_other_user(obj)
        if user and hasattr(user, 'profile') and user.profile.avatar:
            return request.build_absolute_uri(user.profile.avatar.url)
        return None

    def get_lastMessage(self, obj):
        last = obj.last_message()
        return last.text if last else ""

    def get_time(self, obj):
        last = obj.last_message()
        if last and last.timestamp:
            local_dt = timezone.localtime(last.timestamp)
            return local_dt.strftime("%-I:%M %p")
        return ""

    def get_unread(self, obj):
        user = self.context['request'].user
        last = obj.last_message()
        return last and user not in last.read_by.all()

    def get_online(self, obj):
        other = self.get_other_user(obj)
        return getattr(other.profile, 'is_online', False)