import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

/**
 * Browser: admin onboarding page + volunteer portal profile.
 * Create/complete/delete task HTTP → onboardingApi.spec.ts
 * (List assert uses whatever tasks exist in the demo env; API suite owns CRUD.)
 */
test.describe('Onboarding Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('admin onboarding page lists tasks', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Panel de gestión', { timeout: 15000 });

    await page.locator('aside').getByRole('button', { name: 'Voluntariado' }).click();
    await page.locator('aside a[href$="/admin/onboarding"]').click();
    await page.waitForURL('**/admin/onboarding', { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Acogida|Onboarding|tarea|task/i, { timeout: 10000 });
  });

  test('volunteer portal shows profile and badges', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal', { waitUntil: 'load' });
    await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Mi Perfil' }).first()).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator('body')).toContainText('Mi portal', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Puntos', { timeout: 10000 });
  });
});
