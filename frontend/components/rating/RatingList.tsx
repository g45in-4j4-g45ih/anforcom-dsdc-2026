"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareOff, TriangleAlert, User } from "lucide-react";
import { fetchRatingSummary, fetchRatings, Rating, RatingSummary } from "@/lib/api";
import StarRating from "./StarRating";

interface RatingListProps {
  storeId: number;
  refreshKey?: number;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

export default function RatingList({ storeId, refreshKey }: RatingListProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const [ratingsData, summaryData] = await Promise.all([
        fetchRatings(storeId),
        fetchRatingSummary(storeId),
      ]);
      setRatings(ratingsData);
      setSummary(summaryData);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (isLoading) {
    return <p className="text-sm text-gray-400">Memuat ulasan...</p>;
  }

  if (loadFailed) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
        <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
        Gagal memuat ulasan. Coba refresh halaman.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StarRating value={Math.round(summary?.average ?? 0)} size="sm" />
        <span className="text-sm font-bold text-gray-900">
          {summary?.average != null ? summary.average.toFixed(1) : "Belum ada rating"}
        </span>
        <span className="text-sm text-gray-400">({summary?.count ?? 0} ulasan)</span>
      </div>

      {ratings.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MessageSquareOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          Belum ada ulasan untuk toko ini.
        </div>
      ) : (
        <ul className="space-y-2">
          {ratings.map((rating) => (
            <li key={rating.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-900">
                  <User className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
                  <span className="truncate">{rating.rater_name}</span>
                </span>
                <StarRating value={rating.score} size="sm" />
              </div>
              {rating.comment && <p className="mt-1.5 text-sm text-gray-600">{rating.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">{formatDate(rating.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
