import { test, expect } from '@playwright/test';
import { adminLogin, loginAsBrowser, BACKEND_URL, authHeaders } from './helpers';

const TASK_TITLE = `E2E Task ${Date.now()}`;

test.describe('Onboarding Flow', () => {
  test.describe.configure({ mode: 'serial' });
  let adminToken: string;
  let adminCsrf: string;

  test.beforeAll(async ({ request }) => {
    const creds = await adminLogin(request);
    adminToken = creds.authToken;
    adminCsrf = creds.csrfToken;
  });

  test('admin can create an onboarding task via API', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/onboarding/tasks`, {
      method: 'POST',
      headers: { ...authHeaders(adminToken, adminCsrf), 'Content-Type': 'application/json' },
      data: {
        title: TASK_TITLE,
        description: 'Creada durante el test E2E',
        display_order: 1,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('admin onboarding page lists tasks', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Admin Panel', { timeout: 15000 });

    await page.locator('a', { hasText: 'Onboarding' }).click();
    await page.waitForURL('**/admin/onboarding', { timeout: 10000 });
    await expect(page.locator('body')).toContainText(TASK_TITLE, { timeout: 10000 });
  });

  test('volunteer portal shows profile and badges', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal', { waitUntil: 'load' });
    await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Mi Perfil' }).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('body')).toContainText('Mi Panel', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Puntos', { timeout: 10000 });
  });

  test('volunteer can mark onboarding task as complete', async ({ request }) => {
    const loginRes = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'general@fundacionaltius.org', password: 'general123' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { authToken, csrfToken } = await loginRes.json();

    const tasksRes = await request.fetch(`${BACKEND_URL}/api/onboarding/tasks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(tasksRes.ok()).toBeTruthy();
    const allTasks = await tasksRes.json();
    const task = allTasks.find((t: any) => t.title === TASK_TITLE);
    expect(task).toBeDefined();

    const completeRes = await request.fetch(`${BACKEND_URL}/api/onboarding/my-progress/complete`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: { task_id: task.id },
    });
    expect(completeRes.ok()).toBeTruthy();

    const progressRes = await request.fetch(`${BACKEND_URL}/api/onboarding/my-progress`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(progressRes.ok()).toBeTruthy();
    const progress = await progressRes.json();
    const completedTask = progress.tasks?.find((t: any) => t.task_id === task.id);
    expect(completedTask).toBeDefined();
    expect(completedTask.completed).toBe(true);
  });

  test('admin can delete onboarding task', async ({ request }) => {
    const adminCreds = await adminLogin(request);
    const tasksRes = await request.fetch(`${BACKEND_URL}/api/onboarding/tasks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminCreds.authToken}` },
    });
    expect(tasksRes.ok()).toBeTruthy();
    const allTasks = await tasksRes.json();
    const task = allTasks.find((t: any) => t.title === TASK_TITLE);
    expect(task).toBeDefined();

    const delRes = await request.fetch(`${BACKEND_URL}/api/onboarding/tasks/${task.id}`, {
      method: 'DELETE',
      headers: authHeaders(adminCreds.authToken, adminCreds.csrfToken),
    });
    expect(delRes.ok()).toBeTruthy();
  });
});
