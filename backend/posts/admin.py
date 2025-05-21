from django.contrib import admin
from .models import Tag, Post, Likes, Follow

admin.site.register(Tag)
admin.site.register(Post)
admin.site.register(Likes)
admin.site.register(Follow)
