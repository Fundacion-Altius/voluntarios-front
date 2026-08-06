import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

test.describe('Login Routing Fix', () => {
  test('admin user redirects to /es/admin/dashboard', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Admin Panel', { timeout: 15000 });
  });

  test('general volunteer redirects to /es/portal', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Mi Portal', { timeout: 15000 });
  });

  test('volunteer accessing /es/admin/dashboard gets redirected to /es/portal', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/portal/, { timeout: 15000 });
  });

  test('admin accessing /es/portal gets redirected to /es/admin/dashboard', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/portal', { waitUntil: 'load' });
    await page.waitForURL(/\/es\/admin\/dashboard/, { timeout: 15000 });
  });

  test('bare path /login redirects to /es/login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/login/);
  });

  test('bare path /portal redirects to /es/portal', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/portal/);
  });

  test('bare path /admin/dashboard redirects to /es/admin/dashboard', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/admin/dashboard', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/admin\/dashboard/);
  });

  test('bare path /encuesta redirects to /es/encuesta', async ({ page }) => {
    await page.goto('/encuesta', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/encuesta/);
  });
});
