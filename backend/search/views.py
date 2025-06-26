from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from users.models import Profile
from posts.models import Post, Tag
from search.models import SearchHistory
from search.serializers import RecentSearchUserSerializer, MinimalUserSerializer


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

            user_results = RecentSearchUserSerializer(
                profiles,  # ✅ Truyền Profile objects
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
            ).select_related("searched_user", "searched_user__profile").order_by("-searched_at")[:5]

            recent_profiles = [r.searched_user.profile for r in recent]
            recent_searches = RecentSearchUserSerializer(
                recent_profiles,
                many=True,
                context={"request": request}
            ).data

        return Response({
            "users": user_results,
            "tags": tag_results,
            "places": place_results,
            "recent_searches": recent_searches
        })
        

class AddRecentSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        searched_user_id = request.data.get("user_id")
        if not searched_user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        if int(searched_user_id) == request.user.id:
            return Response({"detail": "Cannot search yourself."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            SearchHistory.objects.update_or_create(
                user=request.user,
                searched_user_id=searched_user_id,
                defaults={"searched_at": timezone.now()}
            )
            return Response({"detail": "Search recorded."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DeleteRecentSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        try:
            SearchHistory.objects.filter(user=request.user, searched_user_id=user_id).delete()
            return Response({"detail": "Recent search deleted."})
        except Exception:
            return Response({"detail": "Error deleting search."}, status=status.HTTP_400_BAD_REQUEST)
        
class ClearAllRecentSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted_count, _ = SearchHistory.objects.filter(user=request.user).delete()
        return Response(
            {"detail": f"Deleted {deleted_count} recent search{'es' if deleted_count != 1 else ''}."},
            status=status.HTTP_200_OK
        )
        
class SearchUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get("q", "").strip()
        if not query:
            return Response([])

        profiles = Profile.objects.filter(
            Q(user__username__icontains=query) |
            Q(full_name__icontains=query)
        ).exclude(user=request.user).select_related("user")[:10]

        serializer = MinimalUserSerializer(profiles, many=True, context={"request": request})
        return Response(serializer.data)