import { test, expect } from '@playwright/test';
import { randomId } from './helpers';

/**
 * Browser: hazte-voluntario form submit.
 * API list/approve/deactivate → voluntarios-back/src/api/candidateApi.spec.ts
 */
test.describe('Candidate Flow', () => {
  const uniqueEmail = `candidate-${randomId('e2e')}@test.com`;

  test('hazte voluntario form submits and shows success', async ({ page }) => {
    await page.goto('/es/hazte-voluntario');
    await page.waitForLoadState('domcontentloaded');

    await page.getByPlaceholder('Tu nombre').fill('E2E Test Voluntario');
    await page.getByPlaceholder('email@ejemplo.com').fill(uniqueEmail);
    await page.getByPlaceholder('+34 600 000 000').fill('+34 612 345 678');
    await page.getByPlaceholder('Ciudad / Municipio').fill('Madrid');
    await page.locator('input[name="fecha_nacimiento"]').fill('2000-01-15');
    await page.getByRole('button', { name: 'Semanal' }).click();
    await page.getByRole('button', { name: 'Sábado' }).click();
    await page.getByPlaceholder('Ej: Por las tardes después de las 16:00').fill('Los sábados por la mañana');

    await page.getByRole('checkbox', { name: 'Acompañamiento' }).click();
    await page.getByRole('checkbox', { name: 'Jardinería' }).click();

    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    await expect(page.getByText('¡Solicitud recibida!')).toBeVisible({ timeout: 15000 });
  });
});
