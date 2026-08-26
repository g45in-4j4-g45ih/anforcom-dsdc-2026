from django.db.models import Avg, Count
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from items.models import Store
from .models import Rating
from .serializers import RatingSerializer


class RatingListCreateView(generics.ListCreateAPIView):
    serializer_class = RatingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Rating.objects.select_related("rater").all()
        store_id = self.request.query_params.get("store")
        if store_id:
            qs = qs.filter(store_id=store_id)
        return qs


class RatingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # you can only edit or delete your own rating
        return Rating.objects.filter(rater=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def store_rating_summary(request, store_id):
    get_object_or_404(Store, pk=store_id)
    agg = Rating.objects.filter(store_id=store_id).aggregate(average=Avg("score"), count=Count("id"))
    return Response(
        {
            "store": store_id,
            "average": round(agg["average"], 2) if agg["average"] is not None else None,
            "count": agg["count"],
        }
    )
