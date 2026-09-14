export function parseTenantSlugFromHost(hostHeader: string | undefined | null): {
  slug: string | null;
  reason: 'ok' | 'apex' | 'no-subdomain' | 'empty';
} {
  if (!hostHeader || !hostHeader.trim()) {
    return { slug: null, reason: 'empty' };
  }
  const host = hostHeader.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (!host) return { slug: null, reason: 'empty' };
  if (host === 'localhost' || host === '127.0.0.1') {
    return { slug: null, reason: 'no-subdomain' };
  }
  const base = (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || 'klaruk.com').toLowerCase();
  if (host === base || host === `www.${base}`) {
    return { slug: null, reason: 'apex' };
  }
  if (host.endsWith(`.${base}`)) {
    const label = host.slice(0, -(base.length + 1));
    if (!label || label === 'www' || label.includes('.')) {
      return { slug: null, reason: 'apex' };
    }
    return { slug: label, reason: 'ok' };
  }
  if (host.endsWith('.localhost')) {
    const label = host.slice(0, -'.localhost'.length);
    if (!label || label.includes('.')) return { slug: null, reason: 'apex' };
    return { slug: label, reason: 'ok' };
  }
  return { slug: null, reason: 'no-subdomain' };
}

/**
 * Syntactic slug check (lowercase alphanumerics + hyphens, DNS-label style).
 * This is NOT an existence check — tenant existence and status always come
 * from the backend (see resolveTenantHost). Used for fail-fast validation
 * where no backend call is appropriate (e.g. OAuth state shaping).
 */
export function isValidTenantSlugFormat(slug: string | undefined | null): boolean {
  return typeof slug === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}

export type TenantHostVerdict =
  | { known: true; active: boolean; status: 'active' | 'suspended' | 'archived' }
  | { known: false }
  | { known: null; failClosed: boolean };

function backendBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

const VERDICT_TTL_MS = 60_000;
const verdictCache = new Map<string, { verdict: TenantHostVerdict; expiresAt: number }>();

/** Test-only cache reset. */
export function resetTenantHostCache(): void {
  verdictCache.clear();
}

async function fetchTenantStatus(slug: string): Promise<TenantHostVerdict> {
  const cached = verdictCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) return cached.verdict;
  let verdict: TenantHostVerdict;
  try {
    const res = await fetch(`${backendBase()}/api/tenants/resolve?slug=${encodeURIComponent(slug)}`, {
      // AbortSignal.timeout exists on Edge and Node 18+; fall back to no
      // timeout where unavailable (the verdict still resolves or fails closed).
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(2000) : undefined,
    });
    if (res.status === 404) {
      verdict = { known: false };
    } else if (!res.ok) {
      // Backend responded but with an error: treat as unreachable for gating.
      verdict = { known: null, failClosed: true };
    } else {
      const body = (await res.json()) as { tenant?: { status?: string } };
      const status = body.tenant?.status;
      verdict =
        status === 'active' || status === 'suspended' || status === 'archived'
          ? { known: true, active: status === 'active', status }
          : { known: null, failClosed: true };
    }
  } catch {
    // Network error, timeout: treat as unreachable for gating.
    verdict = { known: null, failClosed: true };
  }
  verdictCache.set(slug, { verdict, expiresAt: Date.now() + VERDICT_TTL_MS });
  return verdict;
}

/**
 * Backend-driven tenant host verdict.
 *
 * - `{ known: null, failClosed: false }` when the host carries no tenant slug
 *   (apex, localhost, auth hosts). Callers must let the request through.
 * - `{ known: null, failClosed: true }` when the host parsed as a tenant
 *   subdomain but the backend resolve was unreachable/invalid. Callers must
 *   fail closed (503) rather than silently serve.
 * - `{ known: false }` → the backend has no such tenant → 404.
 * - `{ known: true, active: false }` → suspended/archived → 403 (matches the
 *   backend resolver, which answers 403 + tenant_suspended/tenant_archived).
 */
export async function resolveTenantHost(hostHeader: string | undefined | null): Promise<TenantHostVerdict> {
  const parsed = parseTenantSlugFromHost(hostHeader);
  if (parsed.reason !== 'ok' || !parsed.slug) return { known: null, failClosed: false };
  return fetchTenantStatus(parsed.slug);
}

const AUTH_HOSTS = ['localhost', '127.0.0.1', 'auth.klaruk.com'];

export function isAuthHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, '');
  return AUTH_HOSTS.includes(normalizedHost);
}

export function getAuthHost(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}
