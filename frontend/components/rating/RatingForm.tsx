"use client";

import { useState } from "react";
import { submitRating } from "@/lib/api";
import StarRating from "./StarRating";

interface RatingFormProps {
  storeId: number;
  onSubmitted?: () => void;
}

export default function RatingForm({ storeId, onSubmitted }: RatingFormProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (score < 1) {
      setError("Pilih dulu rating bintangnya ya.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: ganti dengan token auth beneran dari context/session
      const token = localStorage.getItem("auth_token") ?? "";
      await submitRating(storeId, { score, comment }, token);
      setScore(0);
      setComment("");
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulasan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <label className="mb-1.5 block text-sm font-medium text-gray-700">Beri rating</label>
      <StarRating value={score} onChange={setScore} />

      <label className="mb-1.5 mt-3 block text-sm font-medium text-gray-700">
        Ulasan (opsional)
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Ceritakan pengalamanmu..."
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
      />

      {error && (
        <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
      >
        {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
