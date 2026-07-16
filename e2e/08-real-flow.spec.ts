import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './helpers';

test.describe('Real API Flow @real-api', () => {
  test.setTimeout(60000);

  test('full real API flow: wizard -> PDF download', async ({ page }) => {
    // ───── Step 1: Fill personal data ─────
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('input#nombre').fill('Real E2E Test');
    await page.locator('input#id').fill('X6090907R');
    await page.locator('input#domicilio').fill('123 Real St');
    await page.locator('input#telefono').fill('123456789');
    await page.locator('input#email').fill('real-e2e@test.com');
    await page.locator('#Presencial').check();
    await page.locator('[id="Nave"]').check();
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

    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      return typeof form.onsubmit === 'function' || Object.keys(form).some(k => k.startsWith('__react'));
    }, { timeout: 5000 });

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('label:has-text("Firma:")')).toBeVisible({ timeout: 10000 });

    // ───── Step 2: Signature ─────
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

    // ───── Step 3: Consent checkboxes and submit ─────
    await page.locator('#datos').check();
    await page.locator('#confidencialidad').check();
    await page.locator('#imagen').check();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/contracts') && res.request().method() === 'POST'),
      page.locator('button:has-text("Enviar contrato")').click(),
    ]);
    const body = await response.json();
    const contractId = body?.contract?.id;
    expect(contractId).toBeDefined();

    await expect(page.locator('text=Tu contrato se ha enviado')).toBeVisible({ timeout: 15000 });

    // ───── Step 4: PDF download ─────
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Descargar contrato")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    // ───── Cleanup ─────
    const loginRes = await page.request.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    });
    if (loginRes.ok()) {
      const { authToken, csrfToken } = await loginRes.json();
      await page.request.fetch(`${BACKEND_URL}/api/contracts/${contractId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
        },
      });
    }
  });
});
