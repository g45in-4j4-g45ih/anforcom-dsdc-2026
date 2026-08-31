import { notFound } from "next/navigation";
import { getItem, fetchRatingSummary, ItemApiResponse } from "@/lib/api";

import ItemDetailView, {
  ItemDetailData,
  ItemDetailStore,
} from "@/components/item/ItemDetailView";

function badgeLabelFor(item: ItemApiResponse): string {
  if (item.condition === "byproduct") return "Byproduct";
  return item.listing_type === "donasi" ? "Donasi" : "Jual Diskon";
}

function trimTime(value: string | null): string {
  return value ? value.slice(0, 5) : "-";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function toAbsoluteUrl(url: string) {
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const storeId = item.store_detail?.id ?? item.store;
  const ratingSummary = await fetchRatingSummary(storeId);
  
  const itemData: ItemDetailData = {
    id: item.id,
    name: item.name,
    condition: item.condition,
    status: item.status,
    images: item.images.map((img) =>
      toAbsoluteUrl(img.image),
    ),
    badgeLabel: badgeLabelFor(item),
    priceOriginal: item.price_original ?? undefined,
    priceSale: item.price_sale ?? undefined,
    pickupStart: trimTime(item.pickup_start),
    pickupEnd: trimTime(item.pickup_end),
    pickupDateStart: item.pickup_date_start,
    pickupDateEnd: item.pickup_date_end,
    pickupLocation:
      item.store_detail?.lokasi_detail?.alamat ?? null,
    stock: Number(item.quantity_remaining),
    unit: item.unit,
    category: item.category,
    bestBefore: item.best_before ?? undefined,
    descriptionHtml: item.description,
  };

  const storeData: ItemDetailStore = {
    id: storeId,
    owner: item.store_detail?.owner ?? -1,
    name: item.store_detail?.nama_toko ?? "Toko",
    type: "UMKM", // TODO: belum ada field tipe toko di backend
    distanceLabel: "-", // TODO: belum ada perhitungan jarak dari lokasi user
    rating: ratingSummary.average ?? 0,
    reviewCount: ratingSummary.count,
    whatsappNumber: item.store_detail?.kontak_wa.replace(/^0/, "62") ?? "",
  };

  return <ItemDetailView item={itemData} store={storeData} />;
}