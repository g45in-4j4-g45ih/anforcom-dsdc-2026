"use client";

import { useState } from "react";
import { MessageSquare, User } from "lucide-react";
import PostTypeChip from "./PostTypeChip";
import ReplyForm from "./ReplyForm";
import type { ForumReply, ForumThreadDetail } from "@/types/forum";

interface ThreadDetailViewProps {
  thread: ForumThreadDetail;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ThreadDetailView({ thread }: ThreadDetailViewProps) {
  const [replies, setReplies] = useState<ForumReply[]>(thread.replies);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <PostTypeChip type={thread.post_type} />

        <h1 className="mt-3 text-xl font-bold leading-7 text-gray-900 sm:text-2xl">
          {thread.title}
        </h1>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
          <User className="h-4 w-4 text-secondary" aria-hidden="true" />
          {thread.author_name}
          <span aria-hidden="true">·</span>
          {formatDate(thread.created_at)}
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
          {thread.content}
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <MessageSquare className="h-4 w-4 text-secondary" aria-hidden="true" />
          {replies.length} Balasan
        </h2>

        {replies.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">Belum ada balasan. Jadi yang pertama!</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {replies.map((reply) => (
              <li key={reply.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                  <span className="font-medium text-gray-700">{reply.author_name}</span>
                  <span aria-hidden="true">·</span>
                  {formatDate(reply.created_at)}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-700">{reply.content}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 border-t border-gray-100 pt-5">
          <ReplyForm
            threadId={thread.id}
            onReplied={(reply) => setReplies((current) => [...current, reply])}
          />
        </div>
      </div>
    </div>
  );
}
