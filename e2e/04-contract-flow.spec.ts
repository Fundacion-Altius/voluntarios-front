import { test, expect } from '@playwright/test';

test.describe('Contract Generation Flow', () => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
  };

  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:3001/api/contracts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}', headers: CORS_HEADERS });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'X6090907R' }), headers: CORS_HEADERS });
      }
    });
    await page.route('http://localhost:3001/api/generate-pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 test'),
        headers: CORS_HEADERS,
      });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('full contract generation flow', async ({ page }) => {
    // 3.1 Form fill test scenario
    await page.locator('input#nombre').fill('John Doe');
    await page.locator('input#id').fill('X6090907R');
    await page.locator('input#domicilio').fill('123 Main St');
    await page.locator('input#telefono').fill('123456789');
    await page.locator('input#email').fill('john@example.com');
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
        if (opt.textContent?.trim() === 'Valencia') {
          (opt as HTMLElement).click();
          break;
        }
      }
    });
    await page.locator('#dias-lab-ma').check();

    // Verify form is interactive (React has hydrated) before clicking submit
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      return typeof form.onsubmit === 'function' || Object.keys(form).some(k => k.startsWith('__react'));
    }, { timeout: 5000 });

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('label:has-text("Firma:")')).toBeVisible({ timeout: 10000 });

    // 3.2 Signature canvas test scenario
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

    // 3.3 Consent checkboxes and contract submission scenario
    await page.locator('#datos').check();
    await page.locator('#confidencialidad').check();
    await page.locator('#imagen').check();
    await page.locator('button:has-text("Enviar contrato")').click();
    await expect(page.locator('text=Tu contrato se ha enviado')).toBeVisible();

    // 3.4 PDF download verification scenario
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Descargar contrato")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
