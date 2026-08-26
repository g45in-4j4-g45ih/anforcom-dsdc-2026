"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchStoreByOwner, fetchStoreListings, ItemListing, StoreDetail } from "@/lib/api";
import ListingCard from "./listing/ListingCard";
import RatingForm from "./rating/RatingForm";
import RatingList from "./rating/RatingList";

interface StoreProfileProps {
  userId: string;
}

export default function StoreProfile({ userId }: StoreProfileProps) {
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [listings, setListings] = useState<ItemListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [ratingRefreshKey, setRatingRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const storeData = await fetchStoreByOwner(userId);
      setStore(storeData);
      if (storeData) {
        setListings(await fetchStoreListings(storeData.id));
      }
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-400">Memuat profil toko...</p>;
  }

  if (loadFailed) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        Gagal memuat profil toko. Coba refresh halaman.
      </div>
    );
  }

  if (!store) {
    return <p className="p-6 text-sm text-gray-400">Toko tidak ditemukan.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm text-gray-400">
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt={store.nama_toko} className="h-full w-full object-cover" />
          ) : (
            store.nama_toko.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-gray-900">{store.nama_toko}</h1>
          {store.lokasi_detail?.alamat && (
            <p className="truncate text-sm text-gray-500">{store.lokasi_detail.alamat}</p>
          )}
        </div>
        <Link
          href={`/store/${userId}/edit`}
          className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit Toko
        </Link>
      </div>

      {store.description && (
        <p className="whitespace-pre-line text-sm text-gray-600">{store.description}</p>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Listing</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-gray-400">Toko ini belum punya listing.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Rating & Ulasan</h2>
        <div className="space-y-4">
          <RatingList storeId={store.id} refreshKey={ratingRefreshKey} />
          <RatingForm storeId={store.id} onSubmitted={() => setRatingRefreshKey((k) => k + 1)} />
        </div>
      </div>
    </div>
  );
}
