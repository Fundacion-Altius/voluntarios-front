import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

async function saveForm(page: Page, title: string, publish: boolean): Promise<string> {
  await page.goto(`${FRONTEND_URL}/es/admin/formularios/nuevo`);
  await page.locator('#title').fill(title);
  await page.locator('#description').fill('Formulario abierto a visitantes.');
  await page.getByRole('button', { name: 'Añadir pregunta' }).click();
  await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
  await page.getByRole('button', { name: /Texto corto/ }).click();
  await page.locator('textarea').last().fill('Nombre completo');

  const created = page.waitForResponse(
    (res) => res.request().method() === 'POST' && new URL(res.url()).pathname === '/api/forms/forms',
  );
  await page.getByRole('button', { name: publish ? 'Publicar formulario' : 'Guardar cambios' }).click();
  const response = await created;
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { id?: string; formId?: string };
  const formId = body.id ?? body.formId;
  expect(formId).toBeTruthy();

  await expect(
    page.getByText(publish ? 'Formulario publicado correctamente' : 'Formulario creado correctamente'),
  ).toBeVisible({ timeout: 30000 });

  return formId as string;
}

test.describe('Public form renderer', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('anonymous visitor sees a published form', async ({ page }) => {
    const title = `Publico ${Date.now()}`;
    const formId = await saveForm(page, title, true);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText('Formulario abierto a visitantes.')).toBeVisible();
    await expect(page.getByText('Nombre completo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
  });

  test('anonymous visitor does not see a draft', async ({ page }) => {
    const title = `Borrador ${Date.now()}`;
    const formId = await saveForm(page, title, false);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByRole('heading', { name: 'Formulario no disponible' })).toBeVisible();
  });

  test('anonymous visitor submits a published form and lands on confirmation', async ({ page }) => {
    const title = `Envio ${Date.now()}`;
    const formId = await saveForm(page, title, true);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText('Nombre completo')).toBeVisible();
    await page.getByRole('textbox').first().fill('Persona de prueba');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page).toHaveURL(new RegExp(`/formulario/${formId}/confirmacion`), { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Envío completado|Gracias/i })).toBeVisible();
  });
});
