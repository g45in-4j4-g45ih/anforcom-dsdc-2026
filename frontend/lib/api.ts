const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/locations/search/?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export interface StoreLocation {
  id: number;
  alamat: string;
  latitude: string | null;
  longitude: string | null;
}

export interface StoreDetail {
  id: number;
  owner: number;
  nama_toko: string;
  kontak_wa: string;
  lokasi: number | null;
  lokasi_detail: StoreLocation | null;
  description: string;
  logo: string | null;
}

export interface ItemImageData {
  id: number;
  image: string;
  order: number;
}

export interface ItemListing {
  id: number;
  name: string;
  condition: "layak_makan" | "byproduct";
  listing_type: "diskon" | "donasi" | null;
  quantity_remaining: string;
  unit: string;
  price_original: number | null;
  price_sale: number | null;
  status: string;
  images: ItemImageData[];
  store_detail: StoreDetail;
}

export async function fetchStoreByOwner(userId: number | string): Promise<StoreDetail | null> {
  const res = await fetch(`${API_BASE_URL}/api/stores/?owner=${userId}`);
  if (!res.ok) return null;
  const data: StoreDetail[] = await res.json();
  return data[0] ?? null;
}

export async function fetchStoreListings(storeId: number): Promise<ItemListing[]> {
  const res = await fetch(`${API_BASE_URL}/api/items/?store=${storeId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createItem(formData: FormData, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/items/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.detail ?? "Gagal menyimpan item. Coba cek lagi isian form.");
  }

  return res.json();
}

export interface Rating {
  id: number;
  store: number;
  rater: number;
  rater_name: string;
  score: number;
  comment: string;
  created_at: string;
}

export interface RatingSummary {
  store: number;
  average: number | null;
  count: number;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const firstFieldError = Object.values(body ?? {})[0];
  if (Array.isArray(firstFieldError)) return String(firstFieldError[0]);
  if (typeof firstFieldError === "string") return firstFieldError;
  return body?.detail ?? fallback;
}

export async function fetchRatings(storeId: number): Promise<Rating[]> {
  const res = await fetch(`${API_BASE_URL}/api/ratings/?store=${storeId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRatingSummary(storeId: number): Promise<RatingSummary> {
  const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/rating-summary/`);
  if (!res.ok) return { store: storeId, average: null, count: 0 };
  return res.json();
}

export async function submitRating(
  storeId: number,
  data: { score: number; comment: string },
  token: string
): Promise<Rating> {
  const res = await fetch(`${API_BASE_URL}/api/ratings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ store: storeId, score: data.score, comment: data.comment }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal mengirim ulasan. Coba lagi."));
  }

  return res.json();
}

export async function createLocation(
  data: { alamat: string; latitude?: number | null; longitude?: number | null },
  token: string
): Promise<StoreLocation> {
  const res = await fetch(`${API_BASE_URL}/api/locations/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal menyimpan lokasi."));
  }

  return res.json();
}

export async function createStore(formData: FormData, token: string): Promise<StoreDetail> {
  const res = await fetch(`${API_BASE_URL}/api/stores/`, {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal membuat toko. Coba cek lagi isian form."));
  }

  return res.json();
}

export async function updateStore(storeId: number, formData: FormData, token: string): Promise<StoreDetail> {
  const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/`, {
    method: "PATCH",
    headers: { Authorization: `Token ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal memperbarui toko. Coba cek lagi isian form."));
  }

  return res.json();
}