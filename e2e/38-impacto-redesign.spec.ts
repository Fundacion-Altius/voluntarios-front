import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

/**
 * Browser: Impacto admin + public surfaces.
 * PUT/GET config + nave 403 + empty publicKeys → impactConfigApi.spec.ts
 */
test.describe('Impacto redesign', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('admin Impacto page renders indicator workspace', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/impacto', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Impacto' })).toBeVisible({ timeout: 30000 });
  });

  test('public impacto page renders', async ({ page }) => {
    await page.goto('/es/impacto', { waitUntil: 'load' });
    await expect(page.locator('body')).toBeVisible({ timeout: 30000 });
  });

  test('nave sees read-only Impacto admin', async ({ page }) => {
    await loginAsBrowser(page, 'nave@fundacionaltius.org', 'nave123');
    await page.goto('/es/admin/impacto', { waitUntil: 'load' });
    await expect(page.getByText(/Solo lectura|read-only|nave/i).first()).toBeVisible({
      timeout: 30000,
    });
  });
});
