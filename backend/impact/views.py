from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services import build_impact_summary, completed_claims


@api_view(["GET"])
@permission_classes([AllowAny])
def impact_dashboard(request):
    return Response(
        build_impact_summary(completed_claims())
    )
