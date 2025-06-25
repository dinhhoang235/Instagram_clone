# search/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone

from users.models import Profile
from posts.models import Post, Tag
from search.models import SearchHistory
from search.serializers import RecentSearchUserSerializer


class SearchAllAPIView(APIView):
    def get(self, request):
        query = request.GET.get("q", "").strip()

        user_results = []
        tag_results = []
        place_results = []

        if query:
            # USERS
            profiles = Profile.objects.filter(
                Q(user__username__icontains=query) |
                Q(full_name__icontains=query)
            ).select_related("user")[:10]

            if request.user.is_authenticated:
                for profile in profiles:
                    SearchHistory.objects.update_or_create(
                        user=request.user,
                        searched_user=profile.user,
                        defaults={"searched_at": timezone.now()}
                    )

            # ✅ Truyền đúng User
            user_results = RecentSearchUserSerializer(
                [profile.user for profile in profiles],
                many=True,
                context={"request": request}
            ).data

            # TAGS
            tags = Tag.objects.filter(name__icontains=query)[:10]
            tag_results = [
                {
                    "id": tag.id,
                    "name": tag.name,
                    "postCount": f"{tag.posts.count()/1_000_000:.1f}M" if tag.posts.count() > 1_000_000 else str(tag.posts.count())
                }
                for tag in tags
            ]

            # PLACES
            places_qs = Post.objects.filter(
                location__icontains=query
            ).values("location").annotate(count=Count("id")).order_by("-count").distinct()[:10]

            place_results = [
                {
                    "id": str(index),
                    "name": place["location"],
                    "postCount": f"{place['count']/1_000_000:.1f}M" if place["count"] > 1_000_000 else str(place["count"])
                }
                for index, place in enumerate(places_qs, 1)
            ]

        # RECENT SEARCHES
        recent_searches = []
        if request.user.is_authenticated and not query:
            recent = SearchHistory.objects.filter(
                user=request.user
            ).select_related("searched_user", "searched_user__profile")[:5]

            recent_users = [r.searched_user for r in recent]
            recent_searches = RecentSearchUserSerializer(
                recent_users,
                many=True,
                context={"request": request}
            ).data

        return Response({
            "users": user_results,
            "tags": tag_results,
            "places": place_results,
            "recent_searches": recent_searches
        })
