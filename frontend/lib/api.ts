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