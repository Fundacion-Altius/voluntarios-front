import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

async function openNewForm(page: Page, title: string): Promise<void> {
  await page.goto(`${FRONTEND_URL}/es/admin/formularios/nuevo`);
  // Client page + storageState can briefly render empty under next start (same race as list CTA).
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo Formulario' })).toBeVisible({
    timeout: 60000,
  });
  await page.locator('#title').fill(title);
}

async function addYesNo(page: Page, text: string): Promise<void> {
  await page.getByRole('button', { name: 'Añadir pregunta' }).click();
  await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
  await page.getByRole('button', { name: /Sí \/ No/ }).click();
  await page.locator('textarea').last().fill(text);
}

async function waitForFormCreate(page: Page) {
  return page.waitForResponse(
    (res) => res.request().method() === 'POST' && new URL(res.url()).pathname === '/api/forms/forms',
  );
}

test.describe('Forms admin', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('admin list renders and a builder-created form appears', async ({ page }) => {
    const title = `Lista ${Date.now()}`;
    await page.goto(`${FRONTEND_URL}/es/admin/formularios`);

    // Prefer the CTA over the h2: under parallel auth the page can briefly render empty
    // (!isAuthenticated → null) and the default 5s expect times out.
    const nuevo = page.getByRole('button', { name: 'Nuevo Formulario' });
    await expect(nuevo).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('heading', { level: 2, name: 'Formularios' })).toBeVisible();
    await expect(page.getByText('Unhandled Runtime Error')).toHaveCount(0);

    await nuevo.click();
    await expect(page).toHaveURL(/\/admin\/formularios\/nuevo/);
    await page.locator('#title').fill(title);

    const created = waitForFormCreate(page);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    const response = await created;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText('Formulario creado correctamente')).toBeVisible({ timeout: 30000 });
    await page.goto(`${FRONTEND_URL}/es/admin/formularios`);
    await expect(page.getByRole('cell', { name: title })).toBeVisible({ timeout: 30000 });
  });

  test('admin publishes a form from the builder and can rename it', async ({ page }) => {
    const title = `Builder ${Date.now()}`;
    const renamed = `${title} editado`;
    await openNewForm(page, title);
    await addYesNo(page, 'Participas');

    const created = waitForFormCreate(page);
    await page.getByRole('button', { name: 'Publicar formulario' }).click();
    const response = await created;
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { id?: string; formId?: string };
    const formId = body.id ?? body.formId;
    expect(formId).toBeTruthy();

    await expect(page.getByText('Formulario publicado correctamente')).toBeVisible();

    await page.goto(`${FRONTEND_URL}/es/admin/formularios/${formId}/editar`);
    await expect(page.getByRole('heading', { level: 1, name: 'Editar Formulario' })).toBeVisible();
    await expect(page.locator('#title')).toHaveValue(title);
    await page.locator('#title').fill(renamed);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Formulario actualizado correctamente')).toBeVisible();
  });
});
