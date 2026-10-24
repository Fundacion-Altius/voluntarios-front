import { test, expect } from '@playwright/test';

test.describe('Klaruk marketing pages + contrato route', () => {
  test('landing at /es', async ({ page }) => {
    await page.goto('/es', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu ONG existe para las personas');
    await expect(page.locator('#funcionalidades article.feature')).toHaveCount(6);
    await expect(page.getByRole('link', { name: 'Ver planes y precios' })).toHaveAttribute('href', '/es/planes');
  });

  test('skip link hidden until Tab', async ({ page }) => {
    await page.goto('/es', { waitUntil: 'load' });
    const skip = page.locator('a.skip');
    expect((await skip.boundingBox())!.y).toBeLessThan(0);
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  });

  test('planes at /es/planes', async ({ page }) => {
    await page.goto('/es/planes', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Menos horas de papeleo');
    await expect(page.locator('article.plan')).toHaveCount(4);
    await page.getByRole('button', { name: /Anual/ }).click();
    await expect(page.locator('article.plan').first()).toContainText('390 €');
  });

  test('contract wizard at /es/contrato', async ({ page }) => {
    await page.goto('/es/contrato', { waitUntil: 'load' });
    await expect(page.locator('input#nombre')).toBeVisible();
  });
});
