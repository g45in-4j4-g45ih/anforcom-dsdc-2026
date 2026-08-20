from django.urls import path

from .views import (
    ForumReplyCreateView,
    ForumThreadDetailView,
    ForumThreadListCreateView,
)

urlpatterns = [
    path(
        "forum/threads/",
        ForumThreadListCreateView.as_view(),
        name="forum-thread-list-create",
    ),
    path(
        "forum/threads/<int:pk>/",
        ForumThreadDetailView.as_view(),
        name="forum-thread-detail",
    ),
    path(
        "forum/threads/<int:thread_id>/replies/",
        ForumReplyCreateView.as_view(),
        name="forum-reply-create",
    ),
]
