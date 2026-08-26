"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRatingSummary, fetchRatings, Rating, RatingSummary } from "@/lib/api";
import StarRating from "./StarRating";

interface RatingListProps {
  storeId: number;
  refreshKey?: number;
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
      <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
        Gagal memuat ulasan. Coba refresh halaman.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StarRating value={Math.round(summary?.average ?? 0)} size="sm" />
        <span className="text-sm font-medium text-gray-900">
          {summary?.average != null ? summary.average.toFixed(1) : "Belum ada rating"}
        </span>
        <span className="text-sm text-gray-400">({summary?.count ?? 0} ulasan)</span>
      </div>

      {ratings.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada ulasan untuk toko ini.</p>
      ) : (
        <ul className="space-y-3">
          {ratings.map((rating) => (
            <li key={rating.id} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{rating.rater_name}</span>
                <StarRating value={rating.score} size="sm" />
              </div>
              {rating.comment && <p className="mt-1 text-sm text-gray-600">{rating.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
