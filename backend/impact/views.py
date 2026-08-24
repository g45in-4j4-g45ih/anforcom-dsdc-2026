from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import ImpactHistoryFilterSerializer
from .services import (
    build_impact_history,
    build_impact_summary,
    build_role_summary,
    completed_claims,
    filter_history_claims,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def impact_history(request):
    filters = ImpactHistoryFilterSerializer(
        data=request.query_params,
    )
    filters.is_valid(raise_exception=True)

    claims = filter_history_claims(
        user_completed_claims(request.user),
        filters.validated_data,
    )
    history = build_impact_history(claims, request.user)

    return Response(
        {
            "count": len(history),
            "results": history,
        }
    )
