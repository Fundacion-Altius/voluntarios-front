import { test, expect, type Page, type Locator } from '@playwright/test';
import { loginAsBrowserOnHost } from './helpers';

/**
 * Visual/mobile fixes for Impacto, Juguetes, Alti FAB and Comandero at 390px.
 * Uses the Altius tenant host; does not invent demo figures.
 */

const HOST = 'http://fundacionaltius.localhost:3000';

async function asAdmin(page: Page, path: string) {
  await loginAsBrowserOnHost(page, HOST, 'admin@fundacionaltius.org', 'admin123');
  await page.goto(`${HOST}${path}`, { waitUntil: 'load' });
}

function box(locator: Locator) {
  return locator.boundingBox();
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

async function isInViewport(page: Page, locator: Locator) {
  const handle = await locator.elementHandle();
  if (!handle) return false;
  return page.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= window.innerWidth + 1 && r.top >= 0 && r.bottom <= window.innerHeight + 1;
  }, handle);
}

test.describe('Admin mobile visual fixes', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('Impacto: no raw admin.impact keys, Paso N de 4, tenant name, no console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await asAdmin(page, '/es/admin/impacto');
    await expect(page.getByRole('heading', { name: 'Impacto' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('admin.impact.', { exact: false })).toHaveCount(0);

    await page.getByRole('button', { name: /Configurar indicadores/i }).first().click();
    await expect(page.getByText(/Paso \d de 4/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('admin.impact.steps.of')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Qué hace Fundación Altius/i })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: /Mis indicadores/i }).first().click();
    await expect(page.getByText(/Paso 2 de 4/)).toBeVisible();
    await expect(page.getByRole('button', { name: /2\. Mis indicadores/i })).toBeVisible();
    expect(
      await isInViewport(page, page.getByRole('button', { name: /2\. Mis indicadores/i })),
    ).toBeTruthy();

    const formatting = errors.filter((e) => /FORMATTING_ERROR|MISSING_MESSAGE|admin\.impact\.steps/i.test(e));
    expect(formatting, formatting.join('\n')).toEqual([]);
  });

  test('Juguetes + comandero at 390px: active tab/step visible; Alti does not cover Cerrar/Editar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await asAdmin(page, '/es/admin/toys/entrega');
    await expect(page.getByTestId('toys-tabs')).toBeVisible({ timeout: 30000 });
    const entregaTab = page.getByTestId('toys-tab-entrega');
    await expect(entregaTab).toBeVisible();
    expect(await isInViewport(page, entregaTab)).toBeTruthy();
    await expect(page.getByTestId('toys-reparto-code')).toHaveAttribute(
      'placeholder',
      /Código QR o de familia|QR or family/i,
    );

    await page.goto(`${HOST}/es/admin/toys/cierre`, { waitUntil: 'load' });
    await expect(page.getByTestId('toys-close-open')).toBeVisible({ timeout: 30000 });
    const fab = page.getByTestId('chatbot-drawer-trigger');
    const closeBtn = page.getByTestId('toys-close-open');
    await expect(fab).toBeVisible();
    const fabBox = await box(fab);
    const closeBox = await box(closeBtn);
    expect(fabBox && closeBox).toBeTruthy();
    if (fabBox && closeBox) {
      expect(overlaps(fabBox, closeBox), 'Alti FAB must not cover Cerrar la campaña').toBeFalsy();
    }

    await page.goto(`${HOST}/es/admin/toys/familias`, { waitUntil: 'load' });
    await expect(page.getByTestId('toys-fam-list')).toBeVisible({ timeout: 30000 });
    const editButtons = page.locator('[data-testid^="toys-fam-edit-"]');
    const lastEdit = editButtons.last();
    await lastEdit.scrollIntoViewIfNeeded();
    const editBox = await box(lastEdit);
    const fabBox2 = await box(fab);
    expect(editBox && fabBox2).toBeTruthy();
    if (editBox && fabBox2) {
      expect(overlaps(editBox, fabBox2), 'Alti FAB must not cover last Editar').toBeFalsy();
    }

    await page.goto(`${HOST}/es/admin/comandero`, { waitUntil: 'load' });
    await expect(page.getByTestId('comandero-admin-steps')).toBeVisible({ timeout: 30000 });
    const carta = page.getByTestId('comandero-step-carta');
    expect(await isInViewport(page, carta)).toBeTruthy();
  });
});
