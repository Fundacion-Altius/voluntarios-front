import { platformApi, __resetCsrfCache } from './platform/api';

type FetchInput = string | URL | Request;

function urlOf(url: FetchInput): string {
  if (typeof url === 'string') return url;
  if (url instanceof URL) return url.toString();
  return (url as Request).url;
}

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body), headers: new Headers() });
}

const TEST_USER = { user: { id: '1', email: 'a@b.com', name: 'Test' } };

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
    global.fetch = jest.fn((url: FetchInput) => {
      const urlStr = urlOf(url);
      calls.push(urlStr);
      if (urlStr.includes('/api/csrf-token')) return jsonResponse(200, { csrfToken: 'test' });
      return jsonResponse(200, TEST_USER);
    }) as any;

    await platformApi.login('a@b.com', 'pass');
    expect(calls.some((c) => c.includes('/api/csrf-token'))).toBe(true);
    expect(calls.some((c) => c.includes('/api/platform/auth/login'))).toBe(true);
  });

  it('does not fetch CSRF for GET requests', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn((url: FetchInput) => {
      calls.push(urlOf(url));
      return jsonResponse(200, { prices: [] });
    }) as any;

    await platformApi.getPrices();
    expect(calls.some((c) => c.includes('/api/csrf-token'))).toBe(false);
  });

  it('retries with fresh CSRF on 403', async () => {
    let loginAttempts = 0;
    const calls: string[] = [];
    global.fetch = jest.fn((url: FetchInput) => {
      const urlStr = urlOf(url);
      calls.push(urlStr);
      if (urlStr.includes('/api/csrf-token')) return jsonResponse(200, { csrfToken: `csrf-${calls.length}` });
      if (urlStr.includes('/api/platform/auth/login')) {
        loginAttempts++;
        return loginAttempts === 1 ? jsonResponse(403, { error: 'CSRF' }) : jsonResponse(200, TEST_USER);
      }
      return jsonResponse(404, {});
    }) as any;

    const result = await platformApi.login('a@b.com', 'pass');
    expect(loginAttempts).toBe(2);
    expect(result.user.email).toBe('a@b.com');
    const csrfCalls = calls.filter((c) => c.includes('/api/csrf-token'));
    expect(csrfCalls.length).toBe(2);
  });
});
