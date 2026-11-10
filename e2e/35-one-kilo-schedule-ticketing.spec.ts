import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

/**
 * KL-E-014 / 015 / 016 admin demos against Docker Postgres (NODE_ENV=staging).
 * Requires: back `pnpm local:docker`, front `pnpm run dev`, docker compose up.
 */
test.describe('Admin one-kilo / citas / ticketing (PG)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('un-kilo page seeds and shows roster + prep tally', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/un-kilo', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: '1 kilo de ayuda' })).toBeVisible({ timeout: 20000 });
    // Roster + door both show the family name.
    await expect(page.getByRole('cell', { name: 'Familia García' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Prep tally', { exact: true })).toBeVisible();
    await expect(page.getByText('Arroz 1kg').first()).toBeVisible();
  });

  test('citas page seeds and lists office shifts', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/citas', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Citas en oficina' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Atención oficina L-V')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Mañana').first()).toBeVisible();
  });

  test('ticketing page seeds queue and metrics', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/ticketing', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Ticketing' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('cell', { name: 'María Gómez' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Pendientes', { exact: true })).toBeVisible();
  });
});
