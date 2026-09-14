import { isValidTenantSlugFormat, parseTenantSlugFromHost, resetTenantHostCache, resolveTenantHost } from './tenantHost';

describe('parseTenantSlugFromHost', () => {
  it('parses tenant slugs from klaruk.com and localhost hosts', () => {
    expect(parseTenantSlugFromHost('unknown.klaruk.com')).toEqual({ slug: 'unknown', reason: 'ok' });
    expect(parseTenantSlugFromHost('ghost.localhost:3000')).toEqual({ slug: 'ghost', reason: 'ok' });
    expect(parseTenantSlugFromHost('fundacionaltius.klaruk.com')).toEqual({
      slug: 'fundacionaltius',
      reason: 'ok',
    });
  });

  it('returns non-ok reasons for apex and plain localhost', () => {
    expect(parseTenantSlugFromHost('klaruk.com').reason).toBe('apex');
    expect(parseTenantSlugFromHost('localhost:3000').reason).toBe('no-subdomain');
  });
});

describe('isValidTenantSlugFormat', () => {
  it('accepts well-formed slugs, including platform-created ones', () => {
    expect(isValidTenantSlugFormat('fundacionaltius')).toBe(true);
    expect(isValidTenantSlugFormat('brand-new-ngo-42')).toBe(true);
  });

  it('rejects malformed slugs', () => {
    expect(isValidTenantSlugFormat('Bad Slug!!')).toBe(false);
    expect(isValidTenantSlugFormat('')).toBe(false);
    expect(isValidTenantSlugFormat(undefined)).toBe(false);
    expect(isValidTenantSlugFormat('-leading')).toBe(false);
  });
});

describe('resolveTenantHost', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    resetTenantHostCache();
  });

  afterEach(() => {
    global.fetch = realFetch;
    resetTenantHostCache();
  });

  function mockResolve(status: number, body: unknown = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as any;
  }

  it('returns active for a backend-known active slug (no redeploy needed)', async () => {
    mockResolve(200, { tenant: { id: '1', slug: 'brand-new-ngo', name: 'New', status: 'active' } });
    await expect(resolveTenantHost('brand-new-ngo.klaruk.com')).resolves.toEqual({
      known: true,
      active: true,
      status: 'active',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tenants/resolve?slug=brand-new-ngo'),
      expect.anything(),
    );
  });

  it('returns inactive for suspended/archived slugs', async () => {
    mockResolve(200, { tenant: { id: '1', slug: 'old-ngo', name: 'Old', status: 'suspended' } });
    await expect(resolveTenantHost('old-ngo.klaruk.com')).resolves.toEqual({
      known: true,
      active: false,
      status: 'suspended',
    });
  });

  it('returns unknown when the backend 404s the slug', async () => {
    mockResolve(404);
    await expect(resolveTenantHost('ghost.klaruk.com')).resolves.toEqual({ known: false });
  });

  it('fails open when the backend is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as any;
    await expect(resolveTenantHost('ghost.klaruk.com')).resolves.toEqual({ known: null });
  });

  it('returns null for non-tenant hosts without calling the backend', async () => {
    const spy = jest.fn();
    global.fetch = spy as any;
    await expect(resolveTenantHost('klaruk.com')).resolves.toEqual({ known: null });
    await expect(resolveTenantHost('localhost:3000')).resolves.toEqual({ known: null });
    expect(spy).not.toHaveBeenCalled();
  });

  it('caches backend verdicts briefly', async () => {
    mockResolve(200, { tenant: { id: '1', slug: 'cached-ngo', name: 'C', status: 'active' } });
    await resolveTenantHost('cached-ngo.klaruk.com');
    await resolveTenantHost('cached-ngo.klaruk.com');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
