from django.urls import path
from .api import UserSearchView

urlpatterns = [
    path('search/', UserSearchView.as_view(), name='user-search'),
]
