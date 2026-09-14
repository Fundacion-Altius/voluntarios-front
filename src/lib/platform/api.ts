import type { DashboardMetrics, PlatformTenant, PlatformUser, TenantSettings, TenantSummary } from "@/types/platform";

const API_BASE =
  process.env.NEXT_PUBLIC_PLATFORM_API_URL ??
  `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/platform`;

export const PLATFORM_TOKEN_KEY = "platform_auth_token";

export function getPlatformToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLATFORM_TOKEN_KEY);
}

export function setPlatformToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  else localStorage.removeItem(PLATFORM_TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getPlatformToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Platform API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const platformApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: PlatformUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => request<PlatformUser>("/auth/me"),
  listTenants: () => request<{ tenants: PlatformTenant[] }>("/tenants"),
  getTenant: (id: string) => request<{ tenant: PlatformTenant; settings: TenantSettings | null }>(`/tenants/${id}`),
  createTenant: (input: { name: string; slug: string }) =>
    request<{ tenant: PlatformTenant }>("/tenants", { method: "POST", body: JSON.stringify(input) }),
  updateTenant: (id: string, input: Partial<PlatformTenant>) =>
    request<{ tenant: PlatformTenant }>(`/tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  suspendTenant: (id: string) => request<{ tenant: PlatformTenant }>(`/tenants/${id}/suspend`, { method: "POST" }),
  archiveTenant: (id: string) => request<{ tenant: PlatformTenant }>(`/tenants/${id}/archive`, { method: "POST" }),
  getSettings: (id: string) => request<{ settings: TenantSettings }>(`/tenants/${id}/settings`),
  updateSettings: (id: string, input: Partial<TenantSettings>) =>
    request<{ settings: TenantSettings }>(`/tenants/${id}/settings`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  metrics: () => request<DashboardMetrics>("/dashboard/metrics"),
  tenantList: () => request<{ tenants: TenantSummary[] }>("/dashboard/tenants"),
  timeline: () => request<{ timeline: Record<string, number> }>("/dashboard/metrics/timeline"),
};
