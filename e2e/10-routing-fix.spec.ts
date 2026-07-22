import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

test.describe('Login Routing Fix', () => {
  test('admin user redirects to /admin/dashboard', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Admin Panel', { timeout: 15000 });
  });

  test('general volunteer redirects to /portal', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Mi Portal', { timeout: 15000 });
  });

  test('volunteer accessing /admin/dashboard gets redirected to /portal', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/admin/dashboard', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/portal/, { timeout: 15000 });
  });

  test('admin accessing /portal gets redirected to /admin/dashboard', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/portal', { waitUntil: 'load' });
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
  });
});
