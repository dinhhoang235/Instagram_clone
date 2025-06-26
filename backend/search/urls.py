from django.urls import path
from .views import SearchAllAPIView, ClearAllRecentSearchAPIView, DeleteRecentSearchAPIView, AddRecentSearchAPIView, SearchUserAPIView

urlpatterns = [
    path("", SearchAllAPIView.as_view(), name="search-all"),
    path("recent/add/", AddRecentSearchAPIView.as_view(), name="add-recent-search"),
    path("recent/clear/", ClearAllRecentSearchAPIView.as_view(), name="clear_all_searches"),
    path("recent/<int:user_id>/delete/", DeleteRecentSearchAPIView.as_view(), name="delete_recent_search"),
    path("users/", SearchUserAPIView.as_view(), name="search_users"),
]