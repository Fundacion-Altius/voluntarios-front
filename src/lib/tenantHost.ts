export const KNOWN_TENANT_SLUGS = ['fundacionaltius', 'homelessentrepreneur'] as const;

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

export function should404UnknownTenantHost(hostHeader: string | undefined | null): boolean {
  const parsed = parseTenantSlugFromHost(hostHeader);
  return parsed.reason === 'ok' && !!parsed.slug && !KNOWN_TENANT_SLUGS.includes(parsed.slug as (typeof KNOWN_TENANT_SLUGS)[number]);
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
