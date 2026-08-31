"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createThread, ForumApiError } from "@/lib/forum-api";
import type { ForumPostType } from "@/types/forum";

const TYPE_OPTIONS: { label: string; value: ForumPostType }[] = [
  { label: "Diskusi", value: "discussion" },
  { label: "Request", value: "request" },
];

export default function NewThreadForm() {
  const router = useRouter();
  const [postType, setPostType] = useState<ForumPostType>("discussion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi post wajib diisi.");
      return;
    }

    const token = localStorage.getItem("auth_token") ?? "";
    if (!token) {
      setError("Kamu harus masuk dulu buat bikin post.");
      return;
    }

    setIsSubmitting(true);
    try {
      const thread = await createThread({ post_type: postType, title, content }, token);
      router.push(`/forum/${thread.id}`);
    } catch (err) {
      setError(err instanceof ForumApiError ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h1 className="text-xl font-bold text-gray-900">Bikin Post Baru</h1>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Jenis Post</label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPostType(option.value)}
              className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                postType === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Judul</label>
        <input
          type="text"
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            postType === "request"
              ? "Contoh: Cari ampas kopi buat kompos"
              : "Contoh: Tips simpan sayur biar tahan lama"
          }
          maxLength={200}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Isi Post</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Ceritakan lebih detail..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
        />
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
      >
        {isSubmitting ? "Mengirim..." : "Post"}
      </button>
    </form>
  );
}
