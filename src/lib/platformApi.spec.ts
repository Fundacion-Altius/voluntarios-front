import { platformApi, __resetCsrfCache } from './platform/api';

describe('platformApi CSRF handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    __resetCsrfCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches CSRF token before mutating request', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : (url instanceof URL ? url.toString() : (url as Request).url);
      calls.push(urlStr);
      if (urlStr.includes('/api/csrf-token')) {
        return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ csrfToken: 'test' }), headers: new Headers() });
      }
      return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ user: { id: '1', email: 'a@b.com', name: 'Test' } }), headers: new Headers() });
    }) as any;

    await platformApi.login('a@b.com', 'pass');
    expect(calls.some((c) => c.includes('/api/csrf-token'))).toBe(true);
    expect(calls.some((c) => c.includes('/api/platform/auth/login'))).toBe(true);
  });

  it('does not fetch CSRF for GET requests', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : (url instanceof URL ? url.toString() : (url as Request).url);
      calls.push(urlStr);
      return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ prices: [] }), headers: new Headers() });
    }) as any;

    await platformApi.getPrices();
    expect(calls.some((c) => c.includes('/api/csrf-token'))).toBe(false);
  });

  it('retries with fresh CSRF on 403', async () => {
    let loginAttempts = 0;
    const calls: string[] = [];
    global.fetch = jest.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : (url instanceof URL ? url.toString() : (url as Request).url);
      calls.push(urlStr);
      if (urlStr.includes('/api/csrf-token')) {
        return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ csrfToken: `csrf-${calls.length}` }), headers: new Headers() });
      }
      if (urlStr.includes('/api/platform/auth/login')) {
        loginAttempts++;
        if (loginAttempts === 1) {
          return Promise.resolve({ status: 403, ok: false, json: () => Promise.resolve({ error: 'CSRF' }), headers: new Headers() });
        }
        return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ user: { id: '1', email: 'a@b.com', name: 'Test' } }), headers: new Headers() });
      }
      return Promise.resolve({ status: 404, ok: false, json: () => Promise.resolve({}), headers: new Headers() });
    }) as any;

    const result = await platformApi.login('a@b.com', 'pass');
    expect(loginAttempts).toBe(2);
    expect(result.user.email).toBe('a@b.com');
    const csrfCalls = calls.filter((c) => c.includes('/api/csrf-token'));
    expect(csrfCalls.length).toBe(2);
  });
});
