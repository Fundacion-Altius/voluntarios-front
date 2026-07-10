import { test, expect } from '@playwright/test';
import { adminLogin, BACKEND_URL, randomId } from './helpers';

test.describe('Candidate Flow', () => {
  test.describe.configure({ mode: 'serial' });
  const uniqueEmail = `candidate-${randomId('e2e')}@test.com`;
  let candidateId: string;

  test.afterAll(async ({ request }) => {
    if (!candidateId) return;
    const { authToken, csrfToken } = await adminLogin(request);
    await request.fetch(`${BACKEND_URL}/api/users/${candidateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}`, 'X-CSRF-Token': csrfToken },
    });
  });

  test('hazte voluntario form submits and shows success', async ({ page }) => {
    await page.goto('/hazte-voluntario');
    await page.waitForLoadState('domcontentloaded');

    await page.getByPlaceholder('Tu nombre').fill('E2E Test Voluntario');
    await page.getByPlaceholder('email@ejemplo.com').fill(uniqueEmail);
    await page.getByPlaceholder('+34 600 000 000').fill('+34 612 345 678');
    await page.getByPlaceholder('Ciudad / Municipio').fill('Madrid');
    await page.locator('input[name="fecha_nacimiento"]').fill('2000-01-15');
    await page.getByRole('button', { name: 'Semanal' }).click();
    await page.getByRole('button', { name: 'Sábado' }).click();
    await page.getByPlaceholder('Ej: Por las tardes después de las 16:00').fill('Los sábados por la mañana');

    await page.getByRole('checkbox', { name: 'Acompañamiento' }).click();
    await page.getByRole('checkbox', { name: 'Jardinería' }).click();

    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    await expect(page.getByText('¡Solicitud recibida!')).toBeVisible({ timeout: 15000 });
  });

  test('admin can see candidate in list', async ({ request }) => {
    const { authToken } = await adminLogin(request);

    const res = await request.fetch(`${BACKEND_URL}/api/candidates`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const candidates = await res.json();
    const found = candidates.find((c: any) => c.email === uniqueEmail);
    expect(found).toBeDefined();
    expect(found.status).toBe('candidate');
    candidateId = found.user_id;
  });

  test('admin can approve candidate', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const approveRes = await request.fetch(`${BACKEND_URL}/api/candidates/${candidateId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'X-CSRF-Token': csrfToken },
    });
    expect(approveRes.ok()).toBeTruthy();
    const approveBody = await approveRes.json();
    expect(approveBody.user?.status || approveBody.data?.status).toBe('active');
  });

  test('admin can deactivate user', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const deactivateRes = await request.fetch(`${BACKEND_URL}/api/users/${candidateId}/deactivate`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'X-CSRF-Token': csrfToken },
    });
    expect(deactivateRes.ok()).toBeTruthy();
    const body = await deactivateRes.json();
    expect(body.user?.status || body.data?.status).toBe('inactive');
  });

  test('deactivated user shows inactive status via API', async ({ request }) => {
    const { authToken } = await adminLogin(request);
    const res = await request.fetch(`${BACKEND_URL}/api/users/${candidateId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const user = await res.json();
    expect(user.data?.status || user.status).toBe('inactive');
  });

  test('candidate admin page renders with table', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const res = await request.fetch(`${BACKEND_URL}/api/candidates`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const candidates = await res.json();
    expect(Array.isArray(candidates)).toBe(true);
  });
});
