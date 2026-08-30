const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function toAbsoluteMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

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

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const firstFieldError = Object.values(body ?? {})[0];
  if (Array.isArray(firstFieldError)) return String(firstFieldError[0]);
  if (typeof firstFieldError === "string") return firstFieldError;
  return body?.detail ?? fallback;
}

export async function registerAccount(data: {
  username: string;
  password: string;
  email?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal mendaftar. Coba lagi."));
  }

  return res.json();
}

export async function loginAccount(data: { username: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Username atau password salah."));
  }

  return res.json();
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
  qris_image: string | null;
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
  const res = await fetch(`${API_BASE_URL}/api/stores/?owner=${userId}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data: StoreDetail[] = await res.json();
  return data[0] ?? null;
}

export async function fetchStoreListings(storeId: number): Promise<ItemListing[]> {
  const res = await fetch(`${API_BASE_URL}/api/items/?store=${storeId}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchListings(
  listingType: "diskon" | "donasi",
  status?: string
): Promise<ItemListing[]> {
  const params = new URLSearchParams({ listing_type: listingType });
  if (status) params.set("status", status);

  const res = await fetch(`${API_BASE_URL}/api/items/?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchStoreById(storeId: number): Promise<StoreDetail | null> {
  const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/`, { cache: "no-store" });
  if (!res.ok) return null;
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

export interface ItemImageResponse {
  id: number;
  image: string;
  order: number;
}

export interface ItemApiResponse {
  id: number;
  store: number;
  store_detail: {
    id: number;
    nama_toko: string;
    kontak_wa: string;
    lokasi: number | null;
    lokasi_detail: {
      id: number;
      nama_lengkap: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
  } | null;
  name: string;
  condition: "layak_makan" | "byproduct";
  listing_type: "diskon" | "donasi" | null;
  quantity_total: string;
  quantity_remaining: string;
  unit: string;
  description: string;
  category: string;
  pickup_start: string | null;
  pickup_end: string | null;
  price_original: number | null;
  price_sale: number | null;
  best_before: string | null;
  status: string;
  images: ItemImageResponse[];
  created_at: string;
}

export async function getItem(id: string | number): Promise<ItemApiResponse | null> {
  const res = await fetch(`${API_BASE_URL}/api/items/${id}/`, { cache: "no-store" });
  if (!res.ok) return null;
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

export interface CartItemResponse {
  id: number;
  item: number;
  item_name: string;
  item_image: string | null;
  item_unit: string;
  item_price: number;
  item_stock: string;
  item_status: string;
  store_id: number;
  store_name: string;
  quantity: string;
  added_at: string;
}

export interface CartGroup {
  store_id: number;
  store_name: string;
  items: CartItemResponse[];
}

export async function fetchCart(token: string): Promise<CartGroup[]> {
  const res = await fetch(`${API_BASE_URL}/api/cart/`, {
    headers: { Authorization: `Token ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function addToCart(itemId: number, quantity: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/cart/items/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ item: itemId, quantity }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Gagal menambah ke keranjang.");
  }
  return res.json();
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.quantity?.[0] ?? "Gagal mengubah jumlah.");
  }
  return res.json();
}

export async function removeCartItem(cartItemId: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}/`, {
    method: "DELETE",
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error("Gagal menghapus item dari keranjang.");
}

export interface KlaimResponse {
  id: number;
  item: number;
  item_name: string;
  item_image: string | null;
  item_unit: string;
  jumlah_diklaim: string;
  status: string;
  price_at_claim: number | null;
  total_price: number;
  pickup_method: string;
  pickup_time: string | null;
  shipping_cost: number;
  store_qris: string | null;
  store_kontak_wa: string;
  created_at: string;
}

interface CheckoutPayload {
  pickup_method: "Self Pickup" | "Ojek";
  pickup_time?: string;
  address_text?: string;
  address_lat?: number;
  address_lng?: number;
  shipping_cost?: number;
  notes?: string;
}

export async function checkoutSingleItem(
  itemId: number,
  jumlah: number,
  payload: CheckoutPayload,
  token: string
): Promise<KlaimResponse> {
  const res = await fetch(`${API_BASE_URL}/api/items/${itemId}/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ jumlah, ...payload }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal checkout."));
  }
  return res.json();
}

export async function cartCheckout(
  storeId: number,
  cartItemIds: number[],
  payload: CheckoutPayload,
  token: string
): Promise<KlaimResponse[]> {
  const res = await fetch(`${API_BASE_URL}/api/cart/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      store_id: storeId,
      cart_item_ids: cartItemIds,
      ...payload,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal checkout."));
  }
  return res.json();
}

export async function markKlaimPaid(klaimId: number, token: string): Promise<KlaimResponse> {
  const res = await fetch(`${API_BASE_URL}/api/klaim/${klaimId}/mark-paid/`, {
    method: "PATCH",
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Gagal konfirmasi pembayaran."));
  }
  return res.json();
}