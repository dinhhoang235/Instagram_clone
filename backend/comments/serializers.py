from rest_framework import serializers
from comments.models import Comment

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    user_profile_image = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'body', 'date', 'username', 'user_profile_image', 'is_owner']
        read_only_fields = ['id', 'user', 'date']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_user_profile_image(self, obj):
        request = self.context.get('request')
        user = obj.user
        if hasattr(user, 'profile') and user.profile.image:
            url = user.profile.image.url 
            if request:
                return request.build_absolute_uri(url) 
            return url
        default_url = '/media/default.jpg'
        if request:
            return request.build_absolute_uri(default_url)
        return default_url
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.user == request.user
        return False
    
    def create(self, validated_data):
        # Set the current user as the comment owner
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
