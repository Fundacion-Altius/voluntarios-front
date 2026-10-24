import { test, expect } from '@playwright/test';

// Klaruk marketing (landing + planes) is only for the root host. A tenant host
// must never render it: / and /planes redirect to /<locale>/contrato.
const base = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
const TENANT = process.env.E2E_TENANT_SLUG || 'fundacionaltius';
const tenantOrigin = `${base.protocol}//${TENANT}.localhost:${base.port || '80'}`;

test.describe('tenant host never shows Klaruk marketing', () => {
  for (const [path, locale] of [['/', 'es'], ['/es', 'es'], ['/ca', 'ca'], ['/en', 'en'], ['/es/planes', 'es']] as const) {
    test(`${path} → /${locale}/contrato`, async ({ page }) => {
      await page.goto(`${tenantOrigin}${path}`, { waitUntil: 'load' });
      await expect(page).toHaveURL(new RegExp(`/${locale}/contrato$`));
      await expect(page.locator('.klaruk')).toHaveCount(0);
      await expect(page.locator('input#nombre')).toBeVisible();
    });
  }

  test('root host still shows the landing', async ({ page }) => {
    await page.goto('/es', { waitUntil: 'load' });
    await expect(page.locator('.klaruk')).toHaveCount(1);
  });
});
