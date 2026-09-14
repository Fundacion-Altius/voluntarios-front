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
