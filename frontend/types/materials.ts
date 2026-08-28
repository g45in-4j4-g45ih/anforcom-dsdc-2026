export type MaterialStatus =
  | "Tersedia"
  | "Tersedia Sebagian"
  | "Habis"
  | "Selesai"
  | "Kadaluarsa";

export type MaterialUnit =
  | "kg"
  | "liter"
  | "pcs"
  | "bungkus"
  | "porsi";

export interface MaterialImage {
  id: number;
  image: string;
  order: number;
}

export interface MaterialLocation {
  id: number;
  alamat: string;
  latitude: string | null;
  longitude: string | null;
}

export type MaterialClaimStatus =
  | "Menunggu Pembayaran"
  | "Dibayar"
  | "Selesai"
  | "Batal";

export type MaterialPickupMethod = "Self Pickup" | "Ojek";

export interface MaterialClaim {
  id: number;
  item: number;
  item_name: string;
  item_image: string | null;
  item_unit: string;
  peminat: number;
  peminat_nama: string;
  jumlah_diklaim: string;
  status: MaterialClaimStatus;
  price_at_claim: number | null;
  total_price: number;
  pickup_method: MaterialPickupMethod;
  pickup_time: string | null;
  address_text: string;
  address_lat: number | null;
  address_lng: number | null;
  shipping_cost: number;
  notes: string;
  store_qris: string | null;
  store_kontak_wa: string;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface Material {
  id: number;
  name: string;
  condition: "byproduct";
  category: string;
  description: string;
  quantity_total: string;
  quantity_remaining: string;
  unit: MaterialUnit;
  pickup_start: string | null;
  pickup_end: string | null;
  pickup_date_start: string | null;
  pickup_date_end: string | null;
  status: MaterialStatus;
  is_reported: boolean;
  images: MaterialImage[];
  poster_name: string;
  store_name: string;
  pickup_location: MaterialLocation | null;
  created_at: string;
}

export interface ManagedMaterial extends Material {
  claims: MaterialClaim[];
}

export interface MaterialClaimInput {
  quantity: string;
  pickup_method: MaterialPickupMethod;
  pickup_time?: string | null;
  address_text?: string;
  address_lat?: number | null;
  address_lng?: number | null;
  shipping_cost?: number;
  notes?: string;
}

export interface MaterialFilters {
  search?: string;
  category?: string;
  status?: MaterialStatus;
}

export interface ReportMaterialResponse {
  message: string;
  is_reported: boolean;
}
