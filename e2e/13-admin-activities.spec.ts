import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

async function loginAsAdmin(page: any) {
  await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
  await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
  await page.getByText('Panel de gestión').waitFor({ timeout: 15000 });
}

test.describe('Admin Activities page', () => {
  test('admin activities page renders', async ({ page }) => {
    await loginAsAdmin(page);
    // Sidebar Link href is /admin/actividades → /es/admin/actividades (not portal "Actividades")
    // Grouped sidebar: open the "Actividades" accordion group first.
    await page.locator('aside').getByRole('button', { name: 'Actividades' }).click();
    const link = page.locator('aside').getByRole('link', { name: 'Actividades y turnos' });
    await expect(link).toHaveAttribute('href', /\/admin\/actividades/);
    await link.click();
    await page.waitForURL(/\/(es|en)\/admin\/actividades/, { timeout: 15000 });
    await expect(page.locator('main').getByRole('heading', { name: 'Actividades', exact: true }).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Admin Scanner Page', () => {
  test('scanner page loads', async ({ page }) => {
    await loginAsAdmin(page);
    // Sidebar Link href is /admin/scanner → locale URL /es/admin/scanner
    await page.goto('/es/admin/scanner', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/admin\/scanner/);
    await expect(page.getByRole('heading', { name: 'Escáner QR' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('Pega el código QR aquí')).toBeVisible();
  });

  test('manual code input shows error for invalid code', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/es/admin/scanner', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/es\/admin\/scanner/);
    await expect(page.getByRole('heading', { name: 'Escáner QR' })).toBeVisible({ timeout: 15000 });

    await page.getByPlaceholder('Pega el código QR aquí').fill('INVALID-CODE');
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.locator('.text-destructive')).toBeVisible({ timeout: 15000 });
  });
});
