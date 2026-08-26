import requests
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Location
from .serializers import LocationSerializer

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

SEMARANG_VIEWBOX = "110.28,-6.88,110.55,-7.15"


class LocationCreateView(generics.CreateAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(["GET"])
@permission_classes([AllowAny])
def location_search(request):
    query = request.query_params.get("q", "").strip()
    if len(query) < 3:
        return Response({"results": []})

    params = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 6,
        "countrycodes": "id",
        "viewbox": SEMARANG_VIEWBOX,
        "bounded": 0,
    }
    headers = {
        "User-Agent": "AnforcomDSDC-CircularEconomyApp/1.0 (kontak: namaraforcode@gmail.com)"
    }

    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=5)
        resp.raise_for_status()
        raw_results = resp.json()
    except requests.RequestException:
        return Response({"results": [], "error": "Layanan pencarian lokasi lagi bermasalah."}, status=502)

    results = [
        {"display_name": item.get("display_name"), "lat": item.get("lat"), "lon": item.get("lon")}
        for item in raw_results
    ]
    return Response({"results": results})