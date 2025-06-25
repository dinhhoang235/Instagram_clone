from django.urls import path
from .views import SearchAllAPIView

urlpatterns = [
    path("", SearchAllAPIView.as_view(), name="search-all"),
]