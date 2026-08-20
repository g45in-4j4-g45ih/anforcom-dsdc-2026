from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ForumReply, ForumThread


class ForumAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="karla",
            password="test-password",
        )
        self.other_user = user_model.objects.create_user(
            username="other-user",
            password="test-password",
        )

        self.discussion_thread = ForumThread.objects.create(
            author=self.user,
            post_type=ForumThread.PostType.DISCUSSION,
            title="Cara membuat kompos",
            content="Mari berdiskusi tentang kompos.",
        )
        self.request_thread = ForumThread.objects.create(
            author=self.other_user,
            post_type=ForumThread.PostType.REQUEST,
            title="Mencari ampas kopi",
            content="Saya membutuhkan ampas kopi.",
        )

    def test_thread_list_is_public_and_newest_first(self):
        response = self.client.get(
            reverse("forum-thread-list-create"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(
            response.data[0]["id"],
            self.request_thread.id,
        )

    def test_thread_list_supports_type_filter_and_search(self):
        response = self.client.get(
            reverse("forum-thread-list-create"),
            {
                "type": ForumThread.PostType.REQUEST,
                "search": "kopi",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.request_thread.id,
        )

    def test_anonymous_user_cannot_create_thread(self):
        response = self.client.post(
            reverse("forum-thread-list-create"),
            {
                "post_type": ForumThread.PostType.DISCUSSION,
                "title": "Thread baru",
                "content": "Isi thread baru.",
            },
            format="json",
        )

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )
        self.assertEqual(ForumThread.objects.count(), 2)

    def test_authenticated_user_can_create_thread(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse("forum-thread-list-create"),
            {
                "post_type": ForumThread.PostType.DISCUSSION,
                "title": "  Thread baru  ",
                "content": "  Isi thread baru.  ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        thread = ForumThread.objects.get(pk=response.data["id"])
        self.assertEqual(thread.author, self.user)
        self.assertEqual(thread.title, "Thread baru")
        self.assertEqual(thread.content, "Isi thread baru.")

    def test_whitespace_thread_content_is_rejected(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse("forum-thread-list-create"),
            {
                "post_type": ForumThread.PostType.DISCUSSION,
                "title": "Judul valid",
                "content": "   ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("content", response.data)

    def test_thread_detail_contains_replies(self):
        ForumReply.objects.create(
            thread=self.discussion_thread,
            author=self.other_user,
            content="Reply pertama.",
        )

        response = self.client.get(
            reverse(
                "forum-thread-detail",
                kwargs={"pk": self.discussion_thread.pk},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reply_count"], 1)
        self.assertEqual(len(response.data["replies"]), 1)
        self.assertEqual(
            response.data["replies"][0]["content"],
            "Reply pertama.",
        )

    def test_authenticated_user_can_reply_and_blank_reply_is_rejected(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse(
            "forum-reply-create",
            kwargs={"thread_id": self.discussion_thread.pk},
        )

        success_response = self.client.post(
            url,
            {"content": "  Reply baru.  "},
            format="json",
        )
        blank_response = self.client.post(
            url,
            {"content": "   "},
            format="json",
        )

        self.assertEqual(
            success_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            blank_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        reply = ForumReply.objects.get(
            pk=success_response.data["id"],
        )
        self.assertEqual(reply.author, self.other_user)
        self.assertEqual(reply.content, "Reply baru.")
