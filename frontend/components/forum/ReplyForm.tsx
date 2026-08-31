"use client";

import { useState } from "react";
import { createReply, ForumApiError } from "@/lib/forum-api";
import type { ForumReply } from "@/types/forum";

interface ReplyFormProps {
  threadId: number;
  onReplied: (reply: ForumReply) => void;
}

export default function ReplyForm({ threadId, onReplied }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Balasan nggak boleh kosong.");
      return;
    }

    const token = localStorage.getItem("auth_token") ?? "";
    if (!token) {
      setError("Kamu harus masuk dulu buat membalas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reply = await createReply(threadId, content, token);
      onReplied(reply);
      setContent("");
    } catch (err) {
      setError(err instanceof ForumApiError ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Tulis balasan..."
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
      />

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
      >
        {isSubmitting ? "Mengirim..." : "Balas"}
      </button>
    </form>
  );
}
