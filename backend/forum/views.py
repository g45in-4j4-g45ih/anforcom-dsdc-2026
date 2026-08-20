from django.db.models import Q
from rest_framework import generics, permissions

from .models import ForumThread
from .serializers import (
    ForumReplySerializer,
    ForumThreadDetailSerializer,
    ForumThreadListSerializer,
)


class ForumThreadListCreateView(generics.ListCreateAPIView):
    serializer_class = ForumThreadListSerializer

    def get_queryset(self):
        queryset = (
            ForumThread.objects.select_related("author")
            .prefetch_related("replies")
            .all()
        )

        post_type = self.request.query_params.get("type")
        search = self.request.query_params.get("search")

        if post_type:
            queryset = queryset.filter(post_type=post_type)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )

        return queryset

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ForumThreadDetailView(generics.RetrieveAPIView):
    queryset = (
        ForumThread.objects.select_related("author")
        .prefetch_related("replies__author")
        .all()
    )
    serializer_class = ForumThreadDetailSerializer
    permission_classes = [permissions.AllowAny]


class ForumReplyCreateView(generics.CreateAPIView):
    serializer_class = ForumReplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        thread = generics.get_object_or_404(
            ForumThread,
            pk=self.kwargs["thread_id"],
        )
        serializer.save(
            thread=thread,
            author=self.request.user,
        )
