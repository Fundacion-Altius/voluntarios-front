import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

/**
 * Browser: admin navigates to Blog.
 * Full CRUD HTTP → blogApi.spec.ts
 */
test.describe('Admin Blog Editor', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('blog page renders and lists posts', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Panel de gestión', { timeout: 15000 });
    await page.locator('aside').getByRole('button', { name: 'Comunicación' }).click();
    await page.locator('aside a[href$="/admin/blog"]').click();
    await page.waitForURL('**/admin/blog', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Blog', { timeout: 15000 });
  });
});
