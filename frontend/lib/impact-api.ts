import type {
  ImpactHistoryFilters,
  ImpactHistoryResponse,
  ImpactSummary,
  MyImpactSummary,
} from "@/types/impact";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiErrorBody {
  detail?: string;
  [field: string]: unknown;
}

export class ImpactApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ImpactApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ImpactApiError(
      body.detail ?? "Terjadi kesalahan saat menghubungi server.",
      response.status
    );
  }

  return response.json() as Promise<T>;
}

function authHeader(token: string): HeadersInit {
  return { Authorization: `Token ${token}` };
}

export async function getImpactDashboard(): Promise<ImpactSummary> {
  return request<ImpactSummary>("/api/impact/dashboard/");
}

export async function getMyImpact(token: string): Promise<MyImpactSummary> {
  return request<MyImpactSummary>("/api/impact/me/", { headers: authHeader(token) });
}

export async function getImpactHistory(
  filters: ImpactHistoryFilters,
  token: string
): Promise<ImpactHistoryResponse> {
  const params = new URLSearchParams();
  if (filters.path) params.set("path", filters.path);
  if (filters.category) params.set("category", filters.category);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  const query = params.toString();

  return request<ImpactHistoryResponse>(`/api/impact/history/${query ? `?${query}` : ""}`, {
    headers: authHeader(token),
  });
}
