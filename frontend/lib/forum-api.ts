import type {
  ForumReply,
  ForumThread,
  ForumThreadDetail,
  ForumThreadFilters,
  ForumThreadInput,
} from "@/types/forum";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiErrorBody {
  detail?: string;
  [field: string]: unknown;
}

export class ForumApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ForumApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const firstFieldError = Object.values(body).find(
      (value): value is string[] => Array.isArray(value)
    )?.[0];

    throw new ForumApiError(
      body.detail ?? firstFieldError ?? "Terjadi kesalahan saat menghubungi server.",
      response.status
    );
  }

  return response.json() as Promise<T>;
}

function authHeader(token: string): HeadersInit {
  return { Authorization: `Token ${token}` };
}

export async function getThreads(filters: ForumThreadFilters = {}): Promise<ForumThread[]> {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();

  return request<ForumThread[]>(`/api/forum/threads/${query ? `?${query}` : ""}`);
}

export async function getThread(id: number | string): Promise<ForumThreadDetail> {
  return request<ForumThreadDetail>(`/api/forum/threads/${id}/`);
}

export async function createThread(input: ForumThreadInput, token: string): Promise<ForumThread> {
  return request<ForumThread>("/api/forum/threads/", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(input),
  });
}

export async function createReply(
  threadId: number | string,
  content: string,
  token: string
): Promise<ForumReply> {
  return request<ForumReply>(`/api/forum/threads/${threadId}/replies/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ content }),
  });
}
