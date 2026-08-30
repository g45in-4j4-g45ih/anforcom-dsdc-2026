import { notFound } from "next/navigation";
import { getItem, fetchRatingSummary, fetchRecommendedItems, fetchStoreListings, ItemApiResponse } from "@/lib/api";

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

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const storeId = item.store_detail?.id ?? item.store;
  const ratingSummary = await fetchRatingSummary(storeId);
  const recommendedData = await fetchRecommendedItems().catch(() => []); 
  const storeItemsData = await fetchStoreListings(storeId).catch(() => []);
  const relatedData = storeItemsData.filter((i) => i.id !== item.id).slice(0, 4);
  
  const itemData: ItemDetailData = {
    id: item.id,
    name: item.name,
    images: item.images?.map((img: any) => toAbsoluteUrl(img.image) as string) || [],
    badgeLabel: badgeLabelFor(item),
    priceOriginal: item.price_original ?? undefined,
    priceSale: item.price_sale ?? undefined,
    pickupStart: trimTime(item.pickup_start),
    pickupEnd: trimTime(item.pickup_end),
    stock: Number(item.quantity_remaining),
    unit: item.unit,
    category: item.category,
    bestBefore: item.best_before ?? undefined,
    descriptionHtml: item.description,
  };

  const storeData: ItemDetailStore = {
    id: storeId,
    name: item.store_detail?.nama_toko ?? "Toko",
    rating: ratingSummary.average ?? 0,
    reviewCount: ratingSummary.count,
    whatsappNumber: item.store_detail?.kontak_wa?.replace(/^0/, "62") ?? "",
    
    location: item.store_detail?.lokasi_detail?.alamat || item.store_detail?.lokasi || "Lokasi belum tersedia",
    description: item.store_detail?.description || "",
    profileImage: toAbsoluteUrl(item.store_detail?.logo),
  };

  return (
    <ItemDetailView 
      item={itemData} 
      store={storeData} 
      related={relatedData as any} 
      recommended={recommendedData as any} 
    />
  );
}