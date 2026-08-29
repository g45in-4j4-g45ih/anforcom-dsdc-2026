"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchListings, ItemListing } from "@/lib/api";
import ListingCard from "./ListingCard";

interface ListingGridProps {
  listingType: "diskon" | "donasi";
  title: string;
  emptyMessage: string;
}

export default function ListingGrid({ listingType, title, emptyMessage }: ListingGridProps) {
  const [listings, setListings] = useState<ItemListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setListings(await fetchListings(listingType));
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [listingType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">{title}</h1>

      {isLoading ? (
        <p className="text-sm text-gray-400">Memuat listing...</p>
      ) : loadFailed ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Gagal memuat listing. Coba refresh halaman.
        </div>
      ) : listings.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
