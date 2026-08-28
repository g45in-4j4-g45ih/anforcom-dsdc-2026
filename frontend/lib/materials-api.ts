import type {
  ManagedMaterial,
  Material,
  MaterialClaim,
  MaterialFilters,
  ReportMaterialResponse,
} from "@/types/materials";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiErrorBody {
  detail?: string;
  error?: string;
  message?: string;
}

export class MaterialsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MaterialsApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;

    throw new MaterialsApiError(
      body.detail ??
        body.error ??
        body.message ??
        "Terjadi kesalahan saat menghubungi server.",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

function createAuthorizationHeader(token: string): HeadersInit {
  return {
    Authorization: `Token ${token}`,
  };
}

export async function getMaterials(
  filters: MaterialFilters = {},
): Promise<Material[]> {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);

  const query = params.toString();

  return request<Material[]>(
    `/api/materials/${query ? `?${query}` : ""}`,
  );
}

export async function getMaterial(
  id: number | string,
): Promise<Material> {
  return request<Material>(`/api/materials/${id}/`);
}

export async function getMyMaterials(
  token: string,
): Promise<ManagedMaterial[]> {
  return request<ManagedMaterial[]>("/api/materials/mine/", {
    headers: createAuthorizationHeader(token),
  });
}

export async function reportMaterial(
  id: number,
  token: string,
): Promise<ReportMaterialResponse> {
  return request<ReportMaterialResponse>(
    `/api/materials/${id}/report/`,
    {
      method: "POST",
      headers: createAuthorizationHeader(token),
    },
  );
}

export async function completeMaterialClaim(
  claimId: number,
  token: string,
): Promise<MaterialClaim> {
  return request<MaterialClaim>(
    `/api/klaim/${claimId}/tandai-selesai/`,
    {
      method: "PATCH",
      headers: createAuthorizationHeader(token),
    },
  );
}
