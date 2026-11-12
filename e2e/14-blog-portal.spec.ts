import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';

/**
 * Browser: portal news feed + detail navigation.
 * Post CRUD HTTP → blogApi.spec.ts
 * Setup uses the admin blog editor UI (no BACKEND_URL fetch).
 */
async function publishPostViaAdminUi(page: import('@playwright/test').Page, title: string, body: string) {
  await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
  await page.goto('/es/admin/blog/editor', { waitUntil: 'load' });
  await page.locator('#title').fill(title);
  await page.locator('#body').fill(body);
  await page.locator('#excerpt').fill('Extracto e2e');
  // Category select: pick first available option if present
  const catTrigger = page.locator('[id="category"], button').filter({ hasText: /categor|seleccion/i }).first();
  if (await page.getByRole('combobox').count()) {
    await page.getByRole('combobox').first().click();
    const opt = page.getByRole('option').first();
    if (await opt.count()) await opt.click();
  } else if (await catTrigger.count()) {
    await catTrigger.click();
    const opt = page.getByRole('option').first();
    if (await opt.count()) await opt.click();
  }
  await page.getByRole('button', { name: /guardar|save|publicar/i }).click();
  await page.waitForURL('**/admin/blog', { timeout: 15000 });

  const row = page.locator('div, article, li').filter({ hasText: title }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  // Toggle publish if still draft (Globe icon button)
  const publishBtn = row.getByRole('button').first();
  if (await publishBtn.count()) {
    await publishBtn.click();
  }
}

test.describe.serial('Portal Blog Feed', () => {
  test('portal home shows recent news section', async ({ page }) => {
    const title = `E2E Portal Home ${Date.now()}`;
    await publishPostViaAdminUi(page, title, 'Contenido portal home.');
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Últimas noticias', { timeout: 15000 });
  });

  test('noticias page shows published post and detail navigation', async ({ page }) => {
    const title = `E2E Noticia ${Date.now()}`;
    await publishPostViaAdminUi(page, title, 'Contenido completo del detalle.');
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/es/portal/noticias', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText(title, { timeout: 15000 });

    await page.getByText(title).first().click();
    await expect(page.locator('body')).toContainText(title, { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Contenido completo del detalle.', { timeout: 15000 });
  });
});
