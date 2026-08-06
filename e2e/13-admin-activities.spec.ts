import { test, expect } from '@playwright/test';
import { adminLogin, loginAsBrowser, BACKEND_URL, randomId } from './helpers';

async function loginAsAdmin(page: any) {
  await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
  await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
  await page.getByText('Admin Panel').waitFor({ timeout: 15000 });
}

test.describe('Admin Activities CRUD', () => {
  test.describe.configure({ mode: 'serial' });
  const activityName = `E2E Test Actividad ${randomId('act')}`;

  test('create activity type via API', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);
    const res = await request.fetch(`${BACKEND_URL}/api/activities/types`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json',
      },
      data: {
        name: activityName,
        description: 'Creada durante el test E2E',
        category: 'general',
        default_capacity: 10,
        is_recurring: 'false',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('list activity types includes new one', async ({ request }) => {
    const { authToken } = await adminLogin(request);
    const res = await request.fetch(`${BACKEND_URL}/api/activities/types`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const types = Array.isArray(body) ? body : body.data ? body.data : [];
    const found = types.find((t: any) => t.name === activityName);
    expect(found).toBeDefined();
  });

  test('update activity type via API', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const listRes = await request.fetch(`${BACKEND_URL}/api/activities/types`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const listBody = await listRes.json();
    const types = Array.isArray(listBody) ? listBody : listBody.data ? listBody.data : [];
    const found = types.find((t: any) => t.name === activityName);
    expect(found).toBeDefined();

    const updatedName = `${activityName} (actualizada)`;
    const updateRes = await request.fetch(`${BACKEND_URL}/api/activities/types/${found.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json',
      },
      data: {
        name: updatedName,
        description: 'Actualizada durante el test',
        category: 'logística',
        default_capacity: 20,
      },
    });
    expect(updateRes.ok()).toBeTruthy();
  });

  test('delete activity type via API', async ({ request }) => {
    const updatedName = `${activityName} (actualizada)`;
    const { authToken, csrfToken } = await adminLogin(request);

    const listRes = await request.fetch(`${BACKEND_URL}/api/activities/types`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const listBody = await listRes.json();
    const types = Array.isArray(listBody) ? listBody : listBody.data ? listBody.data : [];
    const found = types.find((t: any) => t.name === updatedName);
    expect(found).toBeDefined();

    const delRes = await request.fetch(`${BACKEND_URL}/api/activities/types/${found.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}`, 'X-CSRF-Token': csrfToken },
    });
    expect(delRes.ok()).toBeTruthy();
  });

test('admin activities page renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Actividades' }).click();
    await page.waitForURL('**/admin/actividades', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Actividades' })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin Scanner Page', () => {
  test('scanner page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('a', { hasText: 'Escáner' }).click();
    await page.waitForURL('**/admin/scanner', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Escáner QR' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('Pega el código QR aquí')).toBeVisible();
  });

  test('manual code input shows error for invalid code', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('a', { hasText: 'Escáner' }).click();
    await page.waitForURL('**/admin/scanner', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Escáner QR' })).toBeVisible({ timeout: 15000 });

    await page.getByPlaceholder('Pega el código QR aquí').fill('INVALID-CODE');
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.locator('.text-destructive')).toBeVisible({ timeout: 15000 });
  });
});
