import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

test.describe('Forms conditional show/hide', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('a later question stays hidden until the source answer matches', async ({ page }) => {
    const title = `Condicional ${Date.now()}`;
    await page.goto(`${FRONTEND_URL}/es/admin/formularios/nuevo`);
    await page.locator('#title').fill(title);

    await page.getByRole('button', { name: 'Añadir pregunta' }).click();
    await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
    await page.getByRole('button', { name: /Sí \/ No/ }).click();
    await page.locator('textarea').last().fill('Participas');

    await page.getByRole('button', { name: 'Añadir pregunta' }).click();
    await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
    await page.getByRole('button', { name: /Sí \/ No/ }).click();
    await page.locator('textarea').last().fill('¿Por qué no participas?');

    const cards = page.locator('textarea');
    await cards
      .last()
      .locator('xpath=ancestor::div[contains(@class,"space-y-4")]')
      .getByRole('button', { name: 'Configurar' })
      .click();
    await page.locator('label').filter({ hasText: 'Mostrar/Ocultar' }).locator('input[type="checkbox"]').check();
    await expect(page.getByText('Configurar Mostrar/Ocultar')).toBeVisible();
    await page.getByRole('combobox').filter({ hasText: /Seleccionar pregunta|Participas|Sin texto/ }).click();
    await page.getByRole('option', { name: /Participas/ }).click();
    await page.getByPlaceholder('Valor esperado').fill('no');

    const created = page.waitForResponse(
      (res) => res.request().method() === 'POST' && new URL(res.url()).pathname === '/api/forms/forms',
    );
    await page.getByRole('button', { name: 'Publicar formulario' }).click();
    const response = await created;
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { id?: string; formId?: string };
    const formId = body.id ?? body.formId;
    expect(formId).toBeTruthy();
    await expect(page.getByText('Formulario publicado correctamente')).toBeVisible({ timeout: 30000 });

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText('Participas')).toBeVisible();
    await expect(page.getByText('¿Por qué no participas?')).toHaveCount(0);

    await page.getByRole('radio', { name: 'No' }).click();
    await expect(page.getByText('¿Por qué no participas?')).toBeVisible();

    await page.getByRole('radio', { name: 'Sí' }).first().click();
    await expect(page.getByText('¿Por qué no participas?')).toHaveCount(0);
  });
});
