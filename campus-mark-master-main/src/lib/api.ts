import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

type PrimitiveBody = Record<string, unknown> | FormData | undefined | null;

interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: PrimitiveBody;
  skipToast?: boolean;
};

const buildHeaders = (body: PrimitiveBody, headers: HeadersInit = {}) => {
  const result = new Headers(headers);
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (token) {
    result.set("Authorization", `Bearer ${token}`);
  }

  if (body && !(body instanceof FormData)) {
    result.set("Content-Type", "application/json");
  }

  return result;
};

const normaliseBody = (body: PrimitiveBody): BodyInit | undefined => {
  if (!body) {
    return undefined;
  }

  if (body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipToast, ...rest } = options;
  const url = /^https?:/i.test(path) ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: buildHeaders(body, rest.headers),
    body: normaliseBody(body),
    credentials: "include",
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok || (payload && payload.success === false)) {
    const message = (payload && payload.message) || response.statusText || "Request failed";

    if (!skipToast) {
      toast.error(message);
    }

    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return (payload ? payload.data : null) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body?: PrimitiveBody, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),
  patch: <T>(path: string, body?: PrimitiveBody, options?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...options }),
  put: <T>(path: string, body?: PrimitiveBody, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: "DELETE", ...options }),
  baseUrl: API_BASE,
};

type Api = typeof api;
export type ApiClient = Api;

export default api;
