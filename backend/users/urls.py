from django.urls import path
from .views import SearchAllAPIView

urlpatterns = [
     path("search/", SearchAllAPIView.as_view()),
]
