import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { FRONTEND_URL, loginAsBrowser } from './helpers';

export const FORMS_ADMIN_AUTH_FILE = path.join(__dirname, '.auth/forms-admin.json');

setup('authenticate admin for forms-review', async ({ page }) => {
  fs.mkdirSync(path.dirname(FORMS_ADMIN_AUTH_FILE), { recursive: true });
  await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
  await page.goto(`${FRONTEND_URL}/es/admin/formularios`);
  await expect(page.getByRole('button', { name: 'Nuevo Formulario' })).toBeVisible({
    timeout: 60000,
  });
  await page.context().storageState({ path: FORMS_ADMIN_AUTH_FILE });
});
