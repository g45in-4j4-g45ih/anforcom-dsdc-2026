import { MessageSquare, User } from "lucide-react";
import Link from "next/link";
import PostTypeChip from "./PostTypeChip";
import type { ForumThread } from "@/types/forum";

interface ThreadCardProps {
  thread: ForumThread;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <Link
      href={`/forum/${thread.id}`}
      className="block min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-lg sm:p-5"
    >
      <PostTypeChip type={thread.post_type} />

      <h2 className="mt-2.5 line-clamp-2 text-base font-bold leading-6 text-gray-900">
        {thread.title}
      </h2>

      <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{stripHtml(thread.content)}</p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex min-w-0 items-center gap-1">
          <User className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
          <span className="truncate">{thread.author_name}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{formatDate(thread.created_at)}</span>
        </span>

        <span className="flex shrink-0 items-center gap-1 font-semibold text-gray-700">
          <MessageSquare className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
          {thread.reply_count}
        </span>
      </div>
    </Link>
  );
}
