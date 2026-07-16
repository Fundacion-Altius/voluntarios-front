import { test, expect } from '@playwright/test';

test.describe('Contract → Email Flow (staging)', () => {
  test('create contract and trigger survey email', async ({ page }) => {
    const uniqueId = `X${Date.now().toString(36).toUpperCase()}`;
    const testEmail = `test-${uniqueId}@test.com`;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('input#nombre').fill('Test User');
    await page.locator('input#id').fill(uniqueId);
    await page.locator('input#domicilio').fill('Calle Test 123');
    await page.locator('input#telefono').fill('600000000');
    await page.locator('input#email').fill(testEmail);

    await page.locator('#Presencial').check();
    await page.locator('[id="Reparto de Alimentos"]').check();

    await page.evaluate(() => {
      const trigger = document.querySelector('#lugar') as HTMLElement;
      if (trigger) trigger.click();
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const opts = document.querySelectorAll('[role="option"]');
      for (const opt of opts) {
        if (opt.textContent?.trim() === 'Madrid') {
          (opt as HTMLElement).click();
          break;
        }
      }
    });
    await page.locator('#dias-lab-ma').check();

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('label:has-text("Firma:")')).toBeVisible({ timeout: 10000 });

    await page.locator('canvas.signature-canvas').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas.signature-canvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.moveTo(50, 50);
          ctx.lineTo(200, 200);
          ctx.stroke();
        }
      }
    });
    await page.locator('button:has-text("Siguiente")').click();
    await expect(page.getByText('Acepto la autorización para')).toBeVisible();

    await page.locator('#datos').check();
    await page.locator('#confidencialidad').check();
    await page.locator('#imagen').check();
    await page.locator('button:has-text("Enviar contrato")').click();
    await expect(page.locator('text=Tu contrato se ha enviado')).toBeVisible({ timeout: 15000 });
  });
});
