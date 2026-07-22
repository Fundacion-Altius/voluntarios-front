import { test, expect } from '@playwright/test';
import { adminLogin, loginAsBrowser, BACKEND_URL } from './helpers';

test.describe('Gamification API', () => {
  let adminToken: string;
  let adminCsrf: string;

  test.beforeAll(async ({ request }) => {
    const creds = await adminLogin(request);
    adminToken = creds.authToken;
    adminCsrf = creds.csrfToken;
  });

  test('profile endpoint returns gamification data', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const profile = await res.json();
    expect(profile).toHaveProperty('level');
    expect(profile).toHaveProperty('totalPoints');
    expect(profile).toHaveProperty('weekPoints');
    expect(profile).toHaveProperty('currentStreak');
    expect(profile).toHaveProperty('badges');
    expect(Array.isArray(profile.badges)).toBe(true);
    expect(profile.totalPoints).toBeGreaterThan(0);
  });

  test('badges endpoint returns badges array', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/badges`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const badges = await res.json();
    const list = Array.isArray(badges) ? badges : badges.data;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    if (list.length > 0) {
      expect(list[0]).toHaveProperty('badge_type');
      expect(list[0]).toHaveProperty('user_id');
    }
  });

  test('ranking endpoint returns top 3', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/ranking`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const ranking = await res.json();
    expect(ranking).toHaveProperty('top3');
    expect(Array.isArray(ranking.top3)).toBe(true);
    expect(ranking.top3.length).toBeGreaterThan(0);
    expect(ranking.top3[0]).toHaveProperty('name');
    expect(ranking.top3[0]).toHaveProperty('points');
  });

  test('admin ranking history endpoint returns data', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/ranking/admin`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const rankings = body.success ? body.data : Array.isArray(body) ? body : [];
    expect(rankings.length).toBeGreaterThan(0);
    if (rankings.length > 0) {
      expect(rankings[0]).toHaveProperty('week_start');
      expect(rankings[0]).toHaveProperty('points');
      expect(rankings[0]).toHaveProperty('position');
    }
  });

  test('certificate endpoint returns PDF', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/certificate`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/pdf');
  });

  test('share card endpoint returns SVG', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/share-card`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('image/svg+xml');
  });

  test('profile endpoint without auth returns 401', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/profile`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('ranking endpoint without auth returns 401', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/gamification/ranking`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });
});

test.describe('Portal UI (authenticated)', () => {

  test('portal page shows profile with level and badges', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal/ranking', { waitUntil: 'load' });
    await page.getByRole('link', { name: 'Mi perfil' }).click();
    await page.waitForURL('**/portal', { timeout: 10000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('Mi Perfil');
    expect(body).toContain('Puntos');
    expect(body).toContain('Nivel');
  });

  test('portal ranking page shows top 3', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal/ranking');
    await page.waitForSelector('h2, h3', { timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).toContain('Ranking semanal');
    expect(body).toContain('#1');
  });

  test('portal logros page shows badges', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal/logros');
    await page.waitForSelector('h2, h3', { timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).toContain('Mis insignias');
  });

  test('admin ranking page shows weekly history', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/admin/ranking');
    await page.waitForSelector('h2, h3', { timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).toContain('Historial de Ranking Semanal');
    expect(body).toContain('pts');
  });
});
