from django.urls import path

from .views import RatingDetailView, RatingListCreateView, store_rating_summary

urlpatterns = [
    path("ratings/", RatingListCreateView.as_view(), name="rating-list-create"),
    path("ratings/<int:pk>/", RatingDetailView.as_view(), name="rating-detail"),
    path("stores/<int:store_id>/rating-summary/", store_rating_summary, name="store-rating-summary"),
]
