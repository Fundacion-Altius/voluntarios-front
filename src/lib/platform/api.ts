import type { DashboardMetrics, PlatformTenant, PlatformUser, TenantSettings, TenantSummary } from "@/types/platform";

const API_BASE =
  process.env.NEXT_PUBLIC_PLATFORM_API_URL ??
  `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/platform`;

/**
 * Platform API client. Token is delivered via HttpOnly cookie set by the
 * backend on login; we do NOT persist the raw JWT anywhere on the client.
 * `credentials: "include"` ensures the cookie is sent with every request.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
    request<{ user: PlatformUser }>("/auth/login", {
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

  // Billing endpoints
  getPrices: () => request<{ prices: Array<{ id: string; unit_amount: number | null; currency: string; interval: string | null; product: { id: string; name: string | null; description: string | null } }> }>("/billing/prices"),
  createCheckoutSession: (tenantId: string, priceId: string) =>
    request<{ sessionId: string; url: string | null }>(`/billing/tenants/${tenantId}/checkout`, {
      method: "POST",
      body: JSON.stringify({ priceId }),
    }),
  createPortalSession: (tenantId: string) =>
    request<{ url: string }>(`/billing/tenants/${tenantId}/portal`, { method: "POST" }),

  // Metrics endpoint
  billingMetrics: () => request<{
    mrr: number;
    arr: number;
    churnRate: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    canceledSubscriptions: number;
    pastDueSubscriptions: number;
    formatted: {
      mrr: string;
      arr: string;
      churnRate: string;
    };
  }>("/metrics"),
};
