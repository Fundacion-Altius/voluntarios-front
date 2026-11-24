import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

async function publishEstrellasOnlyForm(page: Page, title: string): Promise<string> {
  await page.goto(`${FRONTEND_URL}/es/admin/formularios/nuevo`);
  await page.locator('#title').fill(title);
  await page.locator('#description').fill('Cuéntanos cómo ha sido tu experiencia.');

  for (const text of [
    '¿Cómo valoras la organización?',
    '¿Cómo valoras la comunicación?',
  ]) {
    await page.getByRole('button', { name: 'Añadir pregunta' }).click();
    await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
    await page.getByRole('button', { name: /Estrellas/ }).click();
    await page.locator('textarea').last().fill(text);
  }

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
  return formId as string;
}

test.describe('Forms estrellas-only (Altius compat)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  test('anonymous visitor submits an estrellas-only form and lands on confirmation', async ({ page }) => {
    const title = `Valoración de la actividad ${Date.now()}`;
    const formId = await publishEstrellasOnlyForm(page, title);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText('¿Cómo valoras la organización?')).toBeVisible();
    await expect(page.getByText('¿Cómo valoras la comunicación?')).toBeVisible();

    const groups = page.getByRole('radiogroup');
    await expect(groups).toHaveCount(2);
    await groups.nth(0).getByRole('radio').nth(4).click();
    await groups.nth(1).getByRole('radio').nth(3).click();

    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page).toHaveURL(new RegExp(`/formulario/${formId}/confirmacion`), { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Envío completado|Gracias/i })).toBeVisible();
  });
});
