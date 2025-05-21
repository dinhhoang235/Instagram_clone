from django.urls import path
from posts import views

urlpatterns = [
    path('', views.index, name='index'),
    path('newpost/', views.NewPost, name='newpost'),
    path('<uuid:post_id>/', views.PostDetail, name='post-details'),
    path('tag/<slug:tag_slug>', views.Tags, name='tags'),
    path('<uuid:post_id>/like', views.like, name='like'),
    path('<uuid:post_id>/favourite', views.favourite, name='favourite'),
]
