import { request as playwrightRequest, type Page } from '@playwright/test';

export const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

export function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Authenticate in the browser context by calling NextAuth's internal
 * credentials endpoint via the Playwright request fixture, extracting the
 * session cookie from Set-Cookie, and injecting it into the browser page.
 * This avoids the race condition between signIn() and SessionProvider.
 */
export async function loginAsBrowser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const csrfRes = await page.request.get(`${FRONTEND_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  const authRes = await page.request.post(
    `${FRONTEND_URL}/api/auth/callback/credentials`,
    {
      form: { csrfToken, email, password, json: 'true' },
    },
  );

  const raw = authRes.headers()['set-cookie'] || '';
  const match = raw.match(/next-auth\.session-token=([^;]+)/);
  if (!match) {
    throw new Error(
      `Failed to extract next-auth.session-token from Set-Cookie: ${raw}`,
    );
  }

  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: match[1],
      domain: 'localhost',
      path: '/',
    },
  ]);
}

export async function loginAs(
  ctx: ReturnType<typeof playwrightRequest.newContext> extends Promise<infer T> ? T : never,
  email: string,
  password: string,
): Promise<{ authToken: string; csrfToken: string }> {
  const res = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`);
  return res.json();
}

export async function adminLogin(request: any): Promise<{ authToken: string; csrfToken: string }> {
  const res = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
  });
  if (!res.ok()) throw new Error('Admin login failed');
  return res.json();
}

export function authHeaders(token: string, csrf: string) {
  return {
    Authorization: `Bearer ${token}`,
    'X-CSRF-Token': csrf,
  };
}

export const CONTRACT_TEMPLATE = {
  fecha: '2026-06-24',
  domicilio: 'Test St',
  empresa: '',
  adulto: 'SI',
  telefono: '600111222',
  duracion: 'meses',
  modalidad: ['Presencial'],
  lugar: 'Madrid',
  firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  derechoDatos: true,
  derechoImagen: true,
  derechoConfidencialidad: true,
  horario: 'tardes',
};
