import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

/** Product promise: 8 question types render and accept answers through submit. */
const ALL_TYPES: { picker: RegExp; label: string }[] = [
  { picker: /Texto corto/, label: 'Tu nombre' },
  { picker: /Texto largo/, label: 'Cuéntanos más' },
  { picker: /Opción única/, label: 'Elige una opción' },
  { picker: /Opción múltiple/, label: 'Elige varias' },
  { picker: /Estrellas/, label: 'Valoración general' },
  { picker: /Sí \/ No/, label: '¿Volverías?' },
  { picker: /Número/, label: 'Años de experiencia' },
  { picker: /Fecha/, label: 'Fecha de interés' },
];

async function addQuestion(page: Page, picker: RegExp, label: string): Promise<void> {
  await page.getByRole('button', { name: 'Añadir pregunta' }).click();
  await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
  await page.getByRole('button', { name: picker }).click();
  await page.locator('textarea').last().fill(label);
}

async function publishAllTypesForm(page: Page, title: string): Promise<string> {
  await page.goto(`${FRONTEND_URL}/es/admin/formularios/nuevo`);
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo Formulario' })).toBeVisible({
    timeout: 60000,
  });
  await page.locator('#title').fill(title);
  await page.locator('#description').fill('Formulario con los ocho tipos de pregunta.');

  for (const q of ALL_TYPES) {
    await addQuestion(page, q.picker, q.label);
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

test.describe('Forms all question types', () => {
  test.describe.configure({ mode: 'serial', timeout: 180000 });

  test('admin publishes all 8 types and público submits them to confirmation', async ({ page }) => {
    const title = `Ocho tipos ${Date.now()}`;
    const formId = await publishAllTypesForm(page, title);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText(title)).toBeVisible();

    // Step 1 (5 questions)
    await expect(page.getByText('Tu nombre')).toBeVisible();
    await page.getByRole('textbox').first().fill('Ana Público');
    await page.locator('textarea').fill('Detalle de la respuesta larga');
    await page.getByRole('radio', { name: 'Opción 1' }).click();
    await page.getByRole('checkbox', { name: 'Opción 2' }).check();
    await page.getByRole('radio', { name: 'Rate 5 out of 5' }).click();

    await page.getByRole('button', { name: 'Siguiente' }).click();

    // Step 2 (remaining 3)
    await expect(page.getByText('¿Volverías?')).toBeVisible();
    await page.getByRole('radio', { name: 'Sí' }).click();
    await page.locator('input[type="number"]').fill('3');
    await page.locator('input[type="date"]').fill('2026-06-15');

    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page).toHaveURL(new RegExp(`/formulario/${formId}/confirmacion`), { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Envío completado|Gracias/i })).toBeVisible();
  });
});
