if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    url: string;
    method: string;
    headers: Map<string, string>;
    constructor(input: string, init?: { method?: string; headers?: Record<string, string> }) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
  } as any;
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    body: unknown;
    status: number;
    statusText: string;
    headers: Map<string, string>;
    constructor(body: unknown, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
  } as any;
}

jest.mock('next-intl/middleware', () => ({
  __esModule: true,
  default: () => () => ({ status: 200, intlPassthrough: true }),
}));

describe('middleware', () => {
  it('module exports default function', async () => {
    const mod = await import('@/middleware');
    expect(typeof mod.default).toBe('function');
  });

  it('module exports config object', async () => {
    const mod = await import('@/middleware');
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
  });

  it('config matcher excludes ws paths', async () => {
    const mod = await import('@/middleware');
    expect(mod.config.matcher.some((p: string) => /ws/.test(p))).toBe(true);
  });

  it('config matcher excludes api paths', async () => {
    const mod = await import('@/middleware');
    expect(mod.config.matcher.some((p: string) => p.includes('api'))).toBe(true);
  });

  it('config matcher excludes _next paths', async () => {
    const mod = await import('@/middleware');
    expect(mod.config.matcher.some((p: string) => p.includes('_next'))).toBe(true);
  });

  it('config matcher excludes files with extensions', async () => {
    const mod = await import('@/middleware');
    expect(mod.config.matcher.some((p: string) => p.includes('.*\\..*'))).toBe(true);
  });
});

describe('middleware tenant host gate', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  function mockResolve(status: number, body: unknown = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as any;
  }

  function tenantRequest(host: string, pathname = '/es') {
    return {
      headers: { get: (name: string) => (name.toLowerCase() === 'host' ? host : null) },
      nextUrl: { pathname },
    } as any;
  }

  it('404s unknown tenant on a deep page path (matcher covers /es/portal, not just /)', async () => {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    mockResolve(404);
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('ghost.klaruk.com', '/es/portal'));
    expect(res.status).toBe(404);
  });

  it('503s tenant host on deep path when backend unreachable', async () => {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as any;
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('ghost.klaruk.com', '/es'));
    expect(res.status).toBe(503);
  });

  it('404s hosts the backend does not know', async () => {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    mockResolve(404);
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('ghost.klaruk.com'));
    expect(res.status).toBe(404);
  });

  it('403s suspended tenant hosts', async () => {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    mockResolve(200, { tenant: { id: '1', slug: 'old-ngo', name: 'Old', status: 'suspended' } });
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('old-ngo.klaruk.com'));
    expect(res.status).toBe(403);
  });

  it('503s tenant hosts when the backend resolve is unreachable', async () => {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as any;
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('ghost.klaruk.com'));
    expect(res.status).toBe(503);
  });

  it('503s tenant hosts when the backend returns 5xx', async () => {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    global.fetch = jest.fn().mockResolvedValue({
      status: 503,
      ok: false,
      json: () => Promise.resolve({}),
    }) as any;
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('ghost.klaruk.com'));
    expect(res.status).toBe(503);
  });

  it('lets platform paths through without backend checks', async () => {
    const spy = jest.fn();
    global.fetch = spy as any;
    const mod = await import('@/middleware');
    const res = await mod.default(tenantRequest('ghost.klaruk.com', '/platform/dashboard'));
    expect(res.status).toBe(200);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('middleware: Klaruk marketing stays off tenant hosts', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  function mockTenant(status: string) {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ tenant: { id: '1', slug: 'ngo', name: 'NGO', status } }),
    }) as any;
  }

  function req(host: string, pathname: string, cookieLocale?: string) {
    return {
      headers: { get: (name: string) => (name.toLowerCase() === 'host' ? host : null) },
      cookies: { get: (n: string) => (n === 'NEXT_LOCALE' && cookieLocale ? { value: cookieLocale } : undefined) },
      nextUrl: { pathname, clone: () => new URL(`http://${host}${pathname}`) },
    } as any;
  }

  // The test Response polyfill drops Headers objects, so read the redirect
  // target from NextResponse.redirect's argument instead of the Location header.
  let redirectSpy: jest.SpyInstance;
  beforeEach(async () => {
    const { NextResponse } = await import('next/server');
    redirectSpy = jest.spyOn(NextResponse, 'redirect');
  });
  afterEach(() => redirectSpy.mockRestore());
  function locationPath(res: any): string {
    expect(res.status).toBe(307);
    const target = redirectSpy.mock.calls.at(-1)?.[0];
    return new URL(String(target)).pathname;
  }

  async function run(r: any) {
    const { resetTenantHostCache } = await import('@/lib/tenantHost');
    resetTenantHostCache();
    const mod = await import('@/middleware');
    return mod.default(r);
  }

  it.each([
    ['/', 'es'],
    ['/es', 'es'],
    ['/es/', 'es'],
    ['/ca', 'ca'],
    ['/en/', 'en'],
    ['/planes', 'es'],
    ['/planes/', 'es'],
    ['/es/planes/', 'es'],
    ['/en/planes', 'en'],
  ])('tenant host %s redirects to /%s/contrato', async (path, locale) => {
    mockTenant('active');
    const res: any = await run(req('ngo.klaruk.com', path));
    expect(res.status).toBe(307);
    expect(locationPath(res)).toBe(`/${locale}/contrato`);
  });

  it.each(['/', '/planes/'])('no-locale path %s uses the NEXT_LOCALE cookie', async (path) => {
    mockTenant('active');
    const res: any = await run(req('ngo.klaruk.com', path, 'ca'));
    expect(locationPath(res)).toBe('/ca/contrato');
  });

  it('ignores an unsupported NEXT_LOCALE cookie', async () => {
    mockTenant('active');
    const res: any = await run(req('ngo.klaruk.com', '/', 'fr'));
    expect(locationPath(res)).toBe('/es/contrato');
  });

  it('does not redirect other tenant pages', async () => {
    mockTenant('active');
    const res: any = await run(req('ngo.klaruk.com', '/es/contrato'));
    expect(res.intlPassthrough).toBe(true);
  });

  it('still 404s unknown tenant hosts on /', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 404, ok: false, json: () => Promise.resolve({}) }) as any;
    const res: any = await run(req('ghost.klaruk.com', '/'));
    expect(res.status).toBe(404);
  });

  it('still 403s inactive tenant hosts on /', async () => {
    mockTenant('suspended');
    const res: any = await run(req('old.klaruk.com', '/es'));
    expect(res.status).toBe(403);
  });

  it.each(['localhost:3000', 'klaruk.com'])('root host %s passes / and /es/planes through to the marketing pages', async (host) => {
    const spy = jest.fn();
    global.fetch = spy as any;
    for (const path of ['/', '/es', '/es/planes']) {
      const res: any = await run(req(host, path));
      expect(res.intlPassthrough).toBe(true);
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
