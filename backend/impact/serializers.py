from rest_framework import serializers

from .services import RESCUE_PATH_ALIASES, RESCUE_PATHS


class ImpactHistoryFilterSerializer(serializers.Serializer):
    path = serializers.ChoiceField(
        choices=(
            *RESCUE_PATHS,
            *RESCUE_PATH_ALIASES,
        ),
        required=False,
    )
    category = serializers.CharField(
        required=False,
        allow_blank=False,
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        path = attrs.get("path")
        if path in RESCUE_PATH_ALIASES:
            attrs["path"] = RESCUE_PATH_ALIASES[path]

        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                "start_date tidak boleh setelah end_date."
            )

        return attrs
