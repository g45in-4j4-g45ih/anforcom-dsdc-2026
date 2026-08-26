from django.urls import path

from .views import LocationCreateView, location_search

urlpatterns = [
    path("locations/search/", location_search, name="location-search"),
    path("locations/", LocationCreateView.as_view(), name="location-create"),
]