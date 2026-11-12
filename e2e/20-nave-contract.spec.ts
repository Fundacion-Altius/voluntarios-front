import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';

test('contract form renders styled shadcn elements', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`${FRONTEND_URL}/es/`, { waitUntil: 'load' });

  const nombre = page.locator('input[id="nombre"]');
  await expect(nombre).toBeVisible();
  await expect(nombre).toHaveAttribute('type', 'text');

  const dni = page.locator('input[id="id"]');
  await expect(dni).toBeVisible();

  const domicilio = page.locator('input[id="domicilio"]');
  await expect(domicilio).toBeVisible();

  const telefono = page.locator('input[id="telefono"]');
  await expect(telefono).toBeVisible();

  const email = page.locator('input[id="email"]');
  await expect(email).toBeVisible();

  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toContainText('Siguiente');

  expect(errors.length).toBe(0);
});
