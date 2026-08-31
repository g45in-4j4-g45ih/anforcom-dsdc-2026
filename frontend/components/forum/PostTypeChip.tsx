import { MessageCircle, Search } from "lucide-react";
import type { ForumPostType } from "@/types/forum";

interface PostTypeChipProps {
  type: ForumPostType;
  className?: string;
}

const LABELS: Record<ForumPostType, string> = {
  discussion: "Diskusi",
  request: "Request",
};

export default function PostTypeChip({ type, className = "" }: PostTypeChipProps) {
  const Icon = type === "request" ? Search : MessageCircle;
  const colorClass =
    type === "request"
      ? "bg-primary-soft/40 text-primary"
      : "bg-secondary-light/20 text-secondary";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colorClass} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {LABELS[type]}
    </span>
  );
}
