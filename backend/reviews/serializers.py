from rest_framework import serializers

from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
    rater_name = serializers.CharField(source="rater.username", read_only=True)

    class Meta:
        model = Rating
        fields = ["id", "store", "rater", "rater_name", "score", "comment", "created_at"]
        read_only_fields = ["id", "rater", "created_at"]

    def validate(self, data):
        # only enforce these on create — updates only touch score/comment
        if self.instance is not None:
            return data

        request = self.context["request"]
        store = data.get("store")

        if hasattr(request.user, "store") and request.user.store.id == store.id:
            raise serializers.ValidationError({"store": "You can't rate your own store."})

        if Rating.objects.filter(store=store, rater=request.user).exists():
            raise serializers.ValidationError({"store": "You've already rated this store."})

        return data

    def create(self, validated_data):
        validated_data["rater"] = self.context["request"].user
        return Rating.objects.create(**validated_data)
