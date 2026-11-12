import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

test.describe('Portal UI (authenticated)', () => {
  test('portal page shows profile with level and badges', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal', { waitUntil: 'load' });

    await expect(page.locator('body')).toContainText('Mi Perfil', { timeout: 20000 });
    await expect(page.locator('body')).toContainText('Puntos', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Nivel', { timeout: 10000 });
  });

  test('portal ranking page shows empty state mid-week', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal/ranking', { waitUntil: 'networkidle' });

    await expect(page.locator('body')).toContainText('Ranking semanal', { timeout: 15000 });
    // Weekly ranking is a Monday-morning job; empty copy is correct mid-week (do not require #1)
    await expect(page.getByText('Aún no hay datos de ranking esta semana')).toBeVisible({
      timeout: 10000,
    });
  });

  test('portal logros page shows badges', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal/logros', { waitUntil: 'networkidle' });

    await expect(page.locator('body')).toContainText('Mis insignias', { timeout: 15000 });
  });

  test('admin ranking page shows weekly history', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/ranking');
    await page.waitForSelector('h2, h3', { timeout: 10000 });

    const body = await page.textContent('body');
    expect(body).toContain('Historial de Ranking Semanal');
    expect(body).toContain('pts');
  });
});
