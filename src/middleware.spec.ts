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
