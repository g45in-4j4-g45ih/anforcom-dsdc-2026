"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MapPin, MessageSquareText, PackageOpen, Pencil, TriangleAlert } from "lucide-react";
import {
  fetchStoreByOwner,
  fetchStoreListings,
  ItemListing,
  StoreDetail,
  toAbsoluteMediaUrl,
} from "@/lib/api";
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
  const [logoFailed, setLogoFailed] = useState(false);
  const [ratingRefreshKey, setRatingRefreshKey] = useState(0);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setViewerId(localStorage.getItem("auth_user_id"));
    } catch {
      setViewerId(null);
    }
  }, []);

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
    return <p className="text-sm text-gray-400">Memuat profil toko...</p>;
  }

  if (loadFailed) {
    return (
      <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
        <h2 className="mt-3 font-semibold text-gray-900">Profil toko belum dapat dimuat</h2>
        <p className="mt-1 text-sm text-gray-600">Coba refresh halaman.</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <PackageOpen className="mx-auto h-9 w-9 text-gray-400" aria-hidden="true" />
        <h2 className="mt-3 font-semibold text-gray-900">Toko tidak ditemukan</h2>
      </div>
    );
  }

  const isOwner = viewerId !== null && Number(viewerId) === store.owner;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft/40 text-lg font-bold text-primary">
          {store.logo && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toAbsoluteMediaUrl(store.logo)}
              alt={store.nama_toko}
              onError={() => setLogoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            store.nama_toko.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-gray-900">{store.nama_toko}</h1>
          {store.lokasi_detail?.alamat && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
              <span className="truncate">{store.lokasi_detail.alamat}</span>
            </p>
          )}
        </div>
        {isOwner && (
          <Link
            href={`/store/${userId}/edit`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft/30"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit Toko
          </Link>
        )}
      </div>

      {store.description && (
        <p className="whitespace-pre-line rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-600 shadow-sm">
          {store.description}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Listing</h2>
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <PackageOpen className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
            <p className="mt-2 text-sm text-gray-500">Toko ini belum punya listing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {listings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <MessageSquareText className="h-4 w-4 text-secondary" aria-hidden="true" />
          Rating & Ulasan
        </h2>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <RatingList storeId={store.id} refreshKey={ratingRefreshKey} />
          </div>
          {isOwner ? (
            <p className="text-sm text-gray-400">Ini toko kamu sendiri, jadi nggak bisa dikasih rating.</p>
          ) : (
            <RatingForm storeId={store.id} onSubmitted={() => setRatingRefreshKey((k) => k + 1)} />
          )}
        </div>
      </div>
    </div>
  );
}
