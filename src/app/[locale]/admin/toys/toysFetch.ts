import { getCSRFToken } from "@/app/lib/csrf";
import { getApiBaseUrl } from "@/lib/apiUrl";

export const TOYS_BASE = "/api/toys";

/** Unauthenticated (or cookie-only CSRF) calls for the public /juguetes mini-site. */
export async function toysPublicFetch(path: string, init?: RequestInit) {
  const method = (init?.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && !getCSRFToken()) {
    await fetch(`${getApiBaseUrl()}/api/csrf-token`, { credentials: "include" });
  }
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = getCSRFToken();
  if (csrf) h["X-CSRF-Token"] = csrf;
  const res = await fetch(`${getApiBaseUrl()}${TOYS_BASE}${path}`, {
    ...init,
    headers: { ...h, ...(init?.headers as Record<string, string> | undefined) },
    credentials: "include",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false as const, error: body.error || `Error ${res.status}` };
  return { success: true as const, data: body };
}

export function itemsPath(age?: number | string): string {
  if (age === undefined) return "/items";
  if (typeof age === "string") return `/items?ageBand=${age}`;
  return `/items?age=${age}`;
}
