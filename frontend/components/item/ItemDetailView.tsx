"use client";

import { useState } from "react";
import RatingList from "../rating/RatingList";

export interface ItemDetailData {
  id: number;
  name: string;
  images: string[];
  badgeLabel: string;
  priceOriginal?: number;
  priceSale?: number;
  pickupStart: string;
  pickupEnd: string;
  stock: number;
  unit: string;
  category: string;
  bestBefore?: string;
  descriptionHtml: string;
}

export interface ItemDetailStore {
  id: number;
  name: string;
  type: string;
  distanceLabel: string;
  rating: number;
  reviewCount: number;
  whatsappNumber: string;
  profileImage?: string;
}

export interface ItemDetailRelated {
  id: number;
  name: string;
  image: string;
}

interface ItemDetailViewProps {
  item: ItemDetailData;
  store: ItemDetailStore;
  related?: ItemDetailRelated[];
  recommended?: ItemDetailRelated[];
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function Divider() {
  return <div className="h-px w-full bg-gray-100" />;
}

function badgeColorClass(label: string) {
  return label === "Donasi" ? "bg-primary" : "bg-secondary";
}

function WhatsAppIcon({ className, color = "#25D366" }: { className?: string; color?: string }) {
  return (
    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.3773 2.69732C13.6854 0.958733 11.4353 0.000872321 9.0378 0C4.09755 0 0.0769 4.12577 0.0752 9.19709C0.07435 10.8183 0.4873 12.4007 1.2716 13.7952L0 18.5618L4.7512 17.2828C6.06015 18.0158 7.53415 18.4017 9.03395 18.4021H9.0378C13.9772 18.4021 17.9983 14.2759 18 9.20458C18.0009 6.74679 17.0696 4.43586 15.3773 2.69732ZM9.0378 16.8488H9.0348C7.6983 16.8484 6.3872 16.4797 5.24325 15.7833L4.97125 15.6175L2.1517 16.3765L2.9042 13.5553L2.7271 13.266C1.9815 12.0488 1.58745 10.6419 1.5883 9.19755C1.59005 4.9827 4.93165 1.5533 9.04085 1.5533C11.0305 1.55417 12.9008 2.35019 14.3073 3.79542C15.7138 5.24024 16.4878 7.16135 16.4869 9.20371C16.4852 13.419 13.1435 16.8488 9.0378 16.8488ZM13.1238 11.1235C12.8999 11.0084 11.7989 10.4527 11.5935 10.376C11.3881 10.2992 11.239 10.2609 11.0898 10.491C10.9407 10.7213 10.5114 11.239 10.3808 11.3921C10.2501 11.5455 10.1194 11.5645 9.89555 11.4494C9.6717 11.3343 8.95015 11.0917 8.09455 10.3089C7.4289 9.69939 6.97935 8.94704 6.84875 8.7168C6.7181 8.48661 6.835 8.36223 6.9467 8.248C7.04725 8.14481 7.1706 7.97943 7.28275 7.84535C7.3949 7.71127 7.4319 7.61516 7.50665 7.46209C7.58145 7.30862 7.54405 7.17459 7.4882 7.05944C7.4323 6.94435 6.98455 5.8131 6.7976 5.35313C6.6158 4.90506 6.43105 4.96592 6.29395 4.95843C6.1633 4.95176 6.0142 4.95048 5.86465 4.95048C5.7151 4.95048 5.4727 5.00784 5.2673 5.23803C5.0619 5.46822 4.48345 6.02435 4.48345 7.15514C4.48345 8.28592 5.2858 9.37925 5.39795 9.53273C5.5101 9.68621 6.9772 12.0073 9.22345 13.0031C9.75765 13.2399 10.1749 13.3815 10.5002 13.4874C11.0366 13.6625 11.5247 13.6378 11.9106 13.5787C12.3408 13.5125 13.2355 13.0225 13.422 12.4858C13.6085 11.9491 13.6085 11.4886 13.5527 11.3929C13.4968 11.2972 13.3477 11.2386 13.1238 11.1235Z"
        fill={color}
      />
    </svg>
  );
}

export default function ItemDetailView({
  item,
  store,
  related = [],
  recommended = [],
}: ItemDetailViewProps) {
  const [mainIndex, setMainIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  const hasDiscount = item.priceOriginal && item.priceSale && item.priceOriginal > item.priceSale;
  const discountPercent = hasDiscount
    ? Math.round((1 - item.priceSale! / item.priceOriginal!) * 100)
    : 0;

  function handleWhatsAppConnect() {
    const message = `Halo ${store.name}, saya tertarik dengan "${item.name}" (${quantity} ${item.unit}) yang ada di aplikasi. Apakah masih tersedia?`;
    const url = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function handleAddToCart() {
    console.log("Tambah ke keranjang:", { itemId: item.id, quantity });
  }

  function handleBuyNow() {
    console.log("Beli sekarang:", { itemId: item.id, quantity });
  }

  return (
    <div className="mx-auto max-w-5xl bg-white p-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative h-72 overflow-hidden rounded-xl bg-gray-100">
            {item.badgeLabel && (
              <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-medium text-white ${badgeColorClass(item.badgeLabel)}`}>
                {item.badgeLabel}
              </span>
            )}
            {item.images[mainIndex] ? (
              <img src={item.images[mainIndex]} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                Belum ada foto
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {item.images.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMainIndex(idx)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${idx === mainIndex ? "border-primary" : "border-transparent"}`}
              >
                <img src={src} alt={`${item.name} ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">{item.name}</h1>

          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatRupiah(item.priceOriginal!)}
              </span>
            )}
            {item.priceSale != null && (
              <span className="text-xl font-bold text-gray-900">
                {formatRupiah(item.priceSale)}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-primary-dark px-2 py-0.5 text-xs font-bold text-white">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <img src="/icons/clock.svg" alt="" className="h-4 w-4" />
            Waktu pengambilan : {item.pickupStart} - {item.pickupEnd}
          </div>

          <Divider />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Kuantitas</span>
            <div className="flex items-center gap-3 rounded-full border border-gray-200 px-2 py-1">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-secondary-light/20">
                −
              </button>
              <span className="w-4 text-center text-sm font-medium text-gray-900">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(item.stock, q + 1))} className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-secondary-light/20">
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-md shadow-gray-200/60">
            {store.profileImage ? (
              <img
                src={store.profileImage}
                alt={store.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
          <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{store.name}</p>
              <p className="truncate text-xs text-gray-500">
                {store.type} • {store.distanceLabel}
              </p>
              <p className="text-xs text-gray-500">
                <span className="text-primary">★</span> {store.rating.toFixed(1)} • {store.reviewCount} ulasan
              </p>
            </div>
            <button
              type="button"
              onClick={handleWhatsAppConnect}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md shadow-gray-200/60 transition-transform hover:scale-105"
              style={{ backgroundColor: "#25D366" }}
              aria-label="Hubungi via WhatsApp"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" color="#FFFFFF" />
            </button>
          </div>

          <div className="space-y-2">
            <button type="button" onClick={handleAddToCart} className="w-full rounded-full border border-secondary py-2.5 text-sm font-medium text-secondary hover:bg-secondary-light/10">
              Tambahkan ke Keranjang
            </button>
            <button type="button" onClick={handleBuyNow} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-light">
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>

      <div className="my-6">
        <Divider />
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button type="button" onClick={() => setActiveTab("details")} className={`border-b-2 pb-2 text-sm font-medium ${activeTab === "details" ? "border-secondary text-secondary" : "border-transparent text-gray-400"}`}>
            Details
          </button>
          <button type="button" onClick={() => setActiveTab("reviews")} className={`border-b-2 pb-2 text-sm font-medium ${activeTab === "reviews" ? "border-secondary text-secondary" : "border-transparent text-gray-400"}`}>
            Reviews
          </button>
        </div>
      </div>

      {activeTab === "details" ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-[160px_1fr] gap-1">
            <span className="text-gray-500">Stok</span>
            <span className="font-medium text-gray-900">
              {item.stock} {item.unit}
            </span>
          </div>
          <Divider />
          <div className="grid grid-cols-[160px_1fr] gap-1">
            <span className="text-gray-500">Kategori Produk</span>
            <span className="font-medium text-gray-900">{item.category}</span>
          </div>
          {item.bestBefore && (
            <>
              <Divider />
              <div className="grid grid-cols-[160px_1fr] gap-1">
                <span className="text-gray-500">Baik Dikonsumsi Sebelum</span>
                <span className="font-medium text-gray-900">{item.bestBefore}</span>
              </div>
            </>
          )}
          <Divider />
          <div>
            <p className="mb-1 text-gray-500">Deskripsi</p>
            <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: item.descriptionHtml }} />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
          <RatingList storeId={store.id} />
        </div>
      )}

      {recommended.length > 0 && (
        <div className="mt-8">
          <Divider />
          <h2 className="mb-3 mt-4 text-sm font-semibold text-gray-800">Direkomendasikan Untukmu</h2>
          <div className="flex gap-3 overflow-x-auto">
            {recommended.map((p) => (
              <div key={p.id} className="w-28 shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-xl bg-gray-100">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <p className="mt-1 truncate text-xs text-gray-600">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-8">
          <Divider />
          <h2 className="mb-3 mt-4 text-sm font-semibold text-gray-800">Item Lain dari {store.name}</h2>
          <div className="flex gap-3 overflow-x-auto">
            {related.map((p) => (
              <div key={p.id} className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}