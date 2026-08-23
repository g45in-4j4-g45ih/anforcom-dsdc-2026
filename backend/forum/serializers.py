from rest_framework import serializers

from .models import ForumReply, ForumThread


class ForumReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    class Meta:
        model = ForumReply
        fields = [
            "id",
            "author_name",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author_name",
            "created_at",
            "updated_at",
        ]

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Reply tidak boleh kosong.")
        return value.strip()


class ForumThreadListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="author.username",
        read_only=True,
    )
    reply_count = serializers.IntegerField(
        source="replies.count",
        read_only=True,
    )

    class Meta:
        model = ForumThread
        fields = [
            "id",
            "post_type",
            "title",
            "content",
            "author_name",
            "reply_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author_name",
            "reply_count",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Judul tidak boleh kosong.")
        return value.strip()

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Isi post tidak boleh kosong.")
        return value.strip()


class ForumThreadDetailSerializer(ForumThreadListSerializer):
    replies = ForumReplySerializer(many=True, read_only=True)

    class Meta(ForumThreadListSerializer.Meta):
        fields = ForumThreadListSerializer.Meta.fields + ["replies"]
