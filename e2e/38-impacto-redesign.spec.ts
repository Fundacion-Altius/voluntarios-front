import { test, expect, type APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { BACKEND_URL, loginAsBrowser } from './helpers';

/**
 * Impacto redesign: guided start → manual value → public toggle → public page
 * shows only published keys (never pads to 8). Creates/clears its own config.
 */

async function adminApi(): Promise<{
  api: APIRequestContext;
  csrf: string;
  dispose: () => Promise<void>;
}> {
  const api = await playwrightRequest.newContext({
    baseURL: BACKEND_URL,
    extraHTTPHeaders: { Host: 'fundacionaltius.localhost' },
  });
  const csrfProbe = await api.get('/api/contracts');
  const setCookie = csrfProbe.headers()['set-cookie'] ?? '';
  const csrfCookie = setCookie
    .split('\n')
    .find((c) => c.startsWith('csrf_token='))
    ?.split(';')[0]
    ?.split('=')[1];
  const login = await api.post('/api/auth/login', {
    data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    headers: {
      Cookie: csrfCookie ? `csrf_token=${csrfCookie}` : '',
      'X-CSRF-Token': csrfCookie ?? '',
    },
  });
  expect(login.ok(), `admin login ${login.status()}`).toBeTruthy();
  const body = await login.json();
  const csrf = body.csrfToken as string;
  return {
    api,
    csrf,
    dispose: async () => api.dispose(),
  };
}

test.describe('Impacto redesign', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  let api: APIRequestContext;
  let csrf: string;
  let dispose: () => Promise<void>;
  const evidenceTag = `e2e-impacto-${Date.now().toString(36)}`;

  test.beforeAll(async () => {
    const ctx = await adminApi();
    api = ctx.api;
    csrf = ctx.csrf;
    dispose = ctx.dispose;
  });

  test.afterAll(async () => {
    // Reset selection so the suite is idempotent.
    await api.put('/api/impact/config', {
      data: {
        organizationName: '',
        guidedCompleted: false,
        selected: [],
        publicHeadline: '',
      },
      headers: { 'X-CSRF-Token': csrf },
    });
    await dispose();
  });

  test('principal: guided set → manual value → public page only published', async ({ page }) => {
    const save = await api.put('/api/impact/config', {
      data: {
        organizationName: `Horizonte ${evidenceTag}`,
        guidedCompleted: true,
        publicHeadline: `Titular ${evidenceTag}`,
        selected: [
          { key: 'volunteer_hours', showOnPublicPage: true },
          { key: 'shift_coverage', showOnPublicPage: false },
          {
            key: 'network_participation',
            showOnPublicPage: true,
            manualValue: 4,
            manualUnit: 'entidades',
            evidence: evidenceTag,
          },
        ],
      },
      headers: { 'X-CSRF-Token': csrf },
    });
    expect(save.status()).toBe(200);
    const saved = await save.json();
    expect(saved.data.selected).toHaveLength(3);

    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/impacto', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Impacto' })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Mis indicadores' }).click();
    await expect(page.getByRole('heading', { name: 'Mis indicadores' })).toBeVisible();
    await expect(page.getByText('Participación y trabajo en red')).toBeVisible();
    await expect(page.getByText('4 entidades').first()).toBeVisible();

    await page.goto('/es/impacto', { waitUntil: 'load' });
    await expect(page.getByText(`Horizonte ${evidenceTag}`)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(`Titular ${evidenceTag}`)).toBeVisible();
    // Published: volunteer_hours + network — not shift_coverage, and not 8 filler cards.
    await expect(page.getByText('entidades del barrio', { exact: false })).toBeVisible();
    const cards = page.locator('.rounded-\\[10px\\].border');
    await expect(cards).toHaveCount(2);
  });

  test('excepción: empty selection → empty public; nave cannot edit', async ({ page }) => {
    await api.put('/api/impact/config', {
      data: { selected: [], guidedCompleted: false, organizationName: '', publicHeadline: '' },
      headers: { 'X-CSRF-Token': csrf },
    });

    await page.goto('/es/impacto', { waitUntil: 'load' });
    await expect(page.getByText(/no hay|empty|Aún no/i).first()).toBeVisible({ timeout: 30000 });

    const naveLogin = await playwrightRequest.newContext({
      baseURL: BACKEND_URL,
      extraHTTPHeaders: { Host: 'fundacionaltius.localhost' },
    });
    const csrfProbe = await naveLogin.get('/api/contracts');
    const setCookie = csrfProbe.headers()['set-cookie'] ?? '';
    const csrfCookie = setCookie
      .split('\n')
      .find((c) => c.startsWith('csrf_token='))
      ?.split(';')[0]
      ?.split('=')[1];
    const login = await naveLogin.post('/api/auth/login', {
      data: { email: 'nave@fundacionaltius.org', password: 'nave123' },
      headers: {
        Cookie: csrfCookie ? `csrf_token=${csrfCookie}` : '',
        'X-CSRF-Token': csrfCookie ?? '',
      },
    });
    expect(login.ok()).toBeTruthy();
    const naveBody = await login.json();
    const blocked = await naveLogin.put('/api/impact/config', {
      data: { organizationName: 'hack' },
      headers: { 'X-CSRF-Token': naveBody.csrfToken },
    });
    expect(blocked.status()).toBe(403);
    await naveLogin.dispose();

    await loginAsBrowser(page, 'nave@fundacionaltius.org', 'nave123');
    await page.goto('/es/admin/impacto', { waitUntil: 'load' });
    await expect(page.getByText(/Solo lectura|read-only|nave/i).first()).toBeVisible({
      timeout: 30000,
    });
  });
});
