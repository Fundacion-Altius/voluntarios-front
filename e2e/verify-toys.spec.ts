import { test, expect } from '@playwright/test';

test('verify toys page', async ({ page }) => {
  await page.goto('http://fundacionaltius.localhost:3000/es/juguetes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);
  
  const pageText = await page.locator('body').innerText();
  console.log('BODY (first 500):', pageText.substring(0, 500).replace(/\n/g, ' | '));
});
