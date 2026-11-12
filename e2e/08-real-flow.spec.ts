import { test, expect } from '@playwright/test';

/**
 * Browser: wizard → PDF download.
 * Field-fidelity GET /api/contracts/:id → contractApi "returns contract detail with encrypted firma and rights flags"
 */
test.describe('Real API Flow @real-api', () => {
  test.setTimeout(60000);

  test('full real API flow: wizard -> PDF download', async ({ page }) => {
    const uniqueId = `e2e-real-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await page.goto('/es/contrato', { waitUntil: 'load' });
    await page.locator('input#nombre').fill(`Real E2E Test ${uniqueId}`);
    await page.locator('input#id').fill(`X6090907R-${uniqueId}`);
    await page.locator('input#domicilio').fill('123 Real St');
    await page.locator('input#telefono').fill('123456789');
    await page.locator('input#email').fill(`real-e2e-${uniqueId}@test.com`);
    await page.locator('#Presencial').click();
    await page.locator('[id="Nave"]').click();
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
    await page.locator('#dias-lab-ma').click();

    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      return typeof form.onsubmit === 'function' || Object.keys(form).some((k) => k.startsWith('__react'));
    }, { timeout: 5000 });

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('label:has-text("Firma:")')).toBeVisible({ timeout: 10000 });

    await page.locator('canvas.signature-canvas').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas.signature-canvas') as HTMLCanvasElement;
      if (canvasEl) {
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          ctx.moveTo(50, 50);
          ctx.lineTo(200, 200);
          ctx.stroke();
        }
      }
    });
    await page.locator('button:has-text("Siguiente")').click();
    await expect(page.getByText('Acepto la autorización para')).toBeVisible();

    await page.locator('#datos').click();
    await page.locator('#confidencialidad').click();
    await page.locator('#imagen').click();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/contracts') && res.request().method() === 'POST'),
      page.locator('button:has-text("Enviar contrato")').click(),
    ]);
    const body = await response.json();
    expect(body?.contract?.id).toBeDefined();

    await expect(page.locator('text=Tu contrato se ha enviado')).toBeVisible({ timeout: 15000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Descargar contrato")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
