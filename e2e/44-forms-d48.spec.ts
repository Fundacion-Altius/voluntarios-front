import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';
const RECO_MSG = 'Te recomendamos el programa Al alza';

function lastQuestionCard(page: Page) {
  return page.locator('textarea').last().locator('xpath=ancestor::div[contains(@class,"space-y-4")]');
}

async function publishD48LikeForm(page: Page, title: string): Promise<string> {
  await page.goto(`${FRONTEND_URL}/es/admin/formularios/nuevo`);
  await page.locator('#title').fill(title);
  await page.locator('#description').fill('Breve cuestionario de acceso al programa.');
  await page.getByRole('checkbox', { name: /Requiere datos de contacto/i }).click();

  // Q1: siNo + dejaFuera when answer = no
  await page.getByRole('button', { name: 'Añadir pregunta' }).click();
  await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
  await page.getByRole('button', { name: /Sí \/ No/ }).click();
  await page.locator('textarea').last().fill('¿Participaste en la actividad?');
  const q1 = lastQuestionCard(page);
  await q1.getByRole('button', { name: 'Configurar' }).click();
  await q1.locator('label').filter({ hasText: /^Deja fuera$/i }).locator('input[type="checkbox"]').check();
  await expect(q1.getByText(/Configurar Deja Fuera/i)).toBeVisible();
  await q1.getByPlaceholder(/Valor esperado/i).fill('no');
  await q1.getByRole('button', { name: /Cerrar|cerrar/i }).click();

  // Q2: siNo + recomienda when answer = si (task 8.3 pregunta2="si")
  await page.getByRole('button', { name: 'Añadir pregunta' }).click();
  await expect(page.getByRole('heading', { name: 'Añadir pregunta' })).toBeVisible();
  await page.getByRole('button', { name: /Sí \/ No/ }).click();
  await page.locator('textarea').last().fill('¿Recomendarías esta actividad?');
  const q2 = lastQuestionCard(page);
  await q2.getByRole('button', { name: 'Configurar' }).click();
  await q2.locator('label').filter({ hasText: /^Recomienda$/i }).locator('input[type="checkbox"]').check();
  await expect(q2.getByText(/Configurar Recomienda/i)).toBeVisible();
  await q2.getByPlaceholder(/Valor esperado/i).fill('si');
  await q2.locator('textarea').last().fill(RECO_MSG);

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

async function fillContact(page: Page) {
  await page.locator('#contactName').fill('Persona D48');
  await page.locator('#contactEmail').fill('d48@example.com');
}

test.describe('Forms D48 paths', () => {
  test.describe.configure({ mode: 'serial', timeout: 180000 });

  test('pregunta1=no submits as rechazado', async ({ page }) => {
    const title = `D48 rechazado ${Date.now()}`;
    const formId = await publishD48LikeForm(page, title);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText('¿Participaste en la actividad?')).toBeVisible();
    await page.getByRole('radio', { name: 'No' }).first().click();
    await expect(page.getByText(/finaliza el formulario|deja fuera/i)).toBeVisible();
    await fillContact(page);
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page).toHaveURL(new RegExp(`/formulario/${formId}/confirmacion.*status=rechazado`), {
      timeout: 30000,
    });
    await expect(page.getByRole('heading', { name: /No puedes continuar|rechazado/i })).toBeVisible();
    await expect(page.getByText(/¿Participaste en la actividad\?:\s*No/)).toBeVisible();
    await expect(page.getByText(/[0-9a-f-]{36}/i)).toHaveCount(0);
  });

  test('pregunta1=si and pregunta2=si completes with recomendacion', async ({ page }) => {
    const title = `D48 completo ${Date.now()}`;
    const formId = await publishD48LikeForm(page, title);

    await page.context().clearCookies();
    await page.goto(`${FRONTEND_URL}/es/formulario/${formId}`);
    await expect(page.getByText('¿Participaste en la actividad?')).toBeVisible();
    await page.getByRole('radio', { name: 'Sí' }).first().click();
    await expect(page.getByText('¿Recomendarías esta actividad?')).toBeVisible();
    await page.getByRole('radio', { name: 'Sí' }).nth(1).click();
    await expect(page.getByText(RECO_MSG)).toBeVisible();
    await fillContact(page);
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page).toHaveURL(new RegExp(`/formulario/${formId}/confirmacion`), { timeout: 30000 });
    await expect(page).toHaveURL(/status=completado/);
    await expect(page.getByRole('heading', { name: /Envío completado|Gracias/i })).toBeVisible();
    await expect(page.getByText(RECO_MSG)).toBeVisible();
  });
});
