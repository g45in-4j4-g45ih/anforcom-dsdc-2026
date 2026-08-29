"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, MapPin, TriangleAlert } from "lucide-react";

import Navbar from "@/components/navigation/Navbar"; 
import RatingList from "../rating/RatingList"; // (Uncomment jika sudah dipakai)
import { addToCart } from "@/lib/api";
import { toast } from "sonner";

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
  category: string;
  quantity_remaining: string | number;
  quantity_total: string | number;
  unit: string;
  pickup_location: { alamat: string } | null;
  pickup_date_end: string | null;
}

interface ItemDetailViewProps {
  item: ItemDetailData;
  store: ItemDetailStore;
  related?: ItemDetailRelated[];
  recommended?: ItemDetailRelated[];
}

// --- UTILITIES ---

function formatRupiah(value: number | string) {
  const num = Number(value);
  if (isNaN(num) || num === 0) return "Rp 0";
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatPickupDate(value: string | null) {
  if (!value) return "Fleksibel";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatQuantity(value: string | number) {
  const quantity = Number(value);
  if (Number.isNaN(quantity)) return value;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

function hasLimitedStock(item: ItemDetailRelated) {
  const total = Number(item.quantity_total);
  const remaining = Number(item.quantity_remaining);

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(remaining) ||
    total <= 0 ||
    remaining <= 0
  ) {
    return false;
  }
  return remaining / total <= 0.25;
}

function badgeColorClass(label: string) {
  return label.toLowerCase() === "donasi" ? "bg-green-600" : "bg-pink-500";
}

// --- COMPONENTS ---

function Divider() {
  return <div className="h-px w-full bg-gray-100" />;
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

function RelatedItemCard({ item }: { item: ItemDetailRelated }) {
  const limitedStock = hasLimitedStock(item);

  return (
    <Link
      href={`/items/${item.id}`}
      aria-label={`Lihat detail ${item.name}`}
      className="group flex w-[240px] sm:w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-pink-400 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/80 bg-white/95 text-pink-500 shadow-sm transition group-hover:bg-pink-500 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>

        {limitedStock && (
          <span className="absolute bottom-0 left-0 flex items-center gap-1 rounded-tr-xl bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm sm:px-3 sm:text-xs">
            <TriangleAlert className="h-3 w-3" aria-hidden="true" />
            Stok Terbatas
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-2 w-max rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 sm:text-xs">
          {item.category}
        </div>

        <h2 className="line-clamp-2 text-sm font-bold leading-5 text-gray-900 sm:text-base">
          {item.name}
        </h2>

        <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">
          Tersedia{" "}
          <span className="font-bold text-gray-900">
            {formatQuantity(item.quantity_remaining)} {item.unit}
          </span>
        </p>

        <div className="mt-auto pt-3">
          <div className="flex min-w-0 items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-[10px] text-gray-500 sm:text-xs">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-pink-500" aria-hidden="true" />
              <span className="truncate">
                {item.pickup_location?.alamat ?? "Lokasi belum tersedia"}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
              {formatPickupDate(item.pickup_date_end)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- MAIN EXPORT COMPONENT ---

export default function ItemDetailView({ item, store, related = [], recommended = [] }: ItemDetailViewProps) {
  const router = useRouter();
  const [mainIndex, setMainIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  const currentPrice = item.priceSale !== undefined ? item.priceSale : (item.priceOriginal !== undefined ? item.priceOriginal : 0);

  const hasDiscount = item.priceOriginal !== undefined && item.priceSale !== undefined && item.priceOriginal > item.priceSale;
  const discountPercent = hasDiscount
    ? Math.round((1 - item.priceSale! / item.priceOriginal!) * 100)
    : 0;
    
  function handleWhatsAppConnect() {
    const message = `Halo ${store.name}, saya tertarik dengan "${item.name}" (${quantity} ${item.unit}).`;
    window.open(`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  }

  async function handleAddToCart() {
    const token = localStorage.getItem("auth_token") ?? "";
    if (!token) {
      toast.error("Kamu harus login dulu buat nambah ke keranjang.");
      router.push("/login");
      return;
    }

    try {
      await addToCart(item.id, quantity, token);
      toast.success("Berhasil ditambahkan ke keranjang!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah ke keranjang.");
    }
  }
  
  function handleBuyNow() {
    console.log("Beli sekarang:", { itemId: item.id, quantity });
  }

  return (
    // Background Light Pink/Beige
    <div className="w-full min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Card Putih Container untuk Detail Produk */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 sm:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            
            {/* Kolom Kiri: Gambar */}
            <div className="space-y-3">
              <div className="relative h-80 overflow-hidden rounded-2xl bg-gray-100">
                {item.badgeLabel && (
                  <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm ${badgeColorClass(item.badgeLabel)}`}>
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
              <div className="flex gap-2 overflow-x-auto pb-1">
                {item.images.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMainIndex(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${idx === mainIndex ? "border-green-600 opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={src} alt={`${item.name} ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Detail & Actions */}
            <div className="flex flex-col space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                <div className="mt-2 flex items-end gap-2">
                 {hasDiscount && (
                  <span className="text-sm font-medium text-gray-400 line-through">
                      {formatRupiah(item.priceOriginal!)}
                    </span>
                  )}
                  
                  {/* Harga utama (Rp 0 atau harga normal atau harga diskon) SELALU muncul */}
                  <span className="text-2xl font-black text-pink-600">
                    {formatRupiah(currentPrice)}
                  </span>
                  
                  {/* Badge persentase diskon */}
                  {hasDiscount && (
                    <span className="mb-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800 border border-green-100">
                <Clock3 className="h-4 w-4 text-green-600" />
                Waktu pengambilan : {item.pickupStart} - {item.pickupEnd}
              </div>

              <Divider />

              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Kuantitas</span>
                <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600">
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(item.stock, q + 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600">
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                {store.profileImage ? (
                  <img src={store.profileImage} alt={store.name} className="h-12 w-12 shrink-0 rounded-full border border-gray-100 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-gray-900">{store.name}</p>
                  <p className="truncate text-xs text-gray-500">{store.type} • {store.distanceLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={handleWhatsAppConnect}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <WhatsAppIcon className="h-5 w-5" color="#FFFFFF" />
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

          <div className="my-8"><Divider /></div>

          {/* TABS DETAIL / REVIEWS */}
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button 
                type="button" 
                onClick={() => setActiveTab("details")} 
                className={`border-b-2 pb-3 text-sm font-bold transition-colors ${activeTab === "details" ? "border-green-600 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                Detail Produk
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab("reviews")} 
                className={`border-b-2 pb-3 text-sm font-bold transition-colors ${activeTab === "reviews" ? "border-green-600 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                Ulasan ({store.reviewCount})
              </button>
            </div>
          </div>

          {activeTab === "details" ? (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-[160px_1fr] gap-2 rounded-lg bg-pink-50/50 px-4 py-3">
                <span className="font-medium text-gray-500">Stok Tersedia</span>
                <span className="font-bold text-gray-900">{item.stock} {item.unit}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2 px-4">
                <span className="font-medium text-gray-500">Kategori Produk</span>
                <span className="font-bold text-gray-900">{item.category}</span>
              </div>
              <div className="px-4 pt-2">
                <p className="mb-2 font-bold text-gray-900">Deskripsi Lengkap</p>
                <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: item.descriptionHtml }} />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
              {/* <RatingList storeId={store.id} /> */}
              <p className="text-gray-500">Komponen Ulasan Disini...</p>
            </div>
          )}
        </div>

        {/* LIST ITEM TERKAIT DAN REKOMENDASI */}
        <div className="mt-12">
          {recommended.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Direkomendasikan Untukmu</h2>
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recommended.map((p) => (
                  <RelatedItemCard key={p.id} item={p} />
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-gray-900">Item Lain dari {store.name}</h2>
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {related.map((p) => (
                  <RelatedItemCard key={p.id} item={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}