from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .services import (
    build_impact_summary,
    build_role_summary,
    completed_claims,
    user_completed_claims,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def impact_dashboard(request):
    return Response(
        build_impact_summary(completed_claims())
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_impact(request):
    claims = user_completed_claims(request.user)
    summary = build_impact_summary(claims)
    summary["by_role"] = build_role_summary(claims, request.user)

    return Response(summary)
