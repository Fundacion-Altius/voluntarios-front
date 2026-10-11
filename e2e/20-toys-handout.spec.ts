import { test, expect } from '@playwright/test';
import { loginAsBrowser, adminLogin, authHeaders, BACKEND_URL } from './helpers';

test.describe('December toys handout (browser)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const tag = String(Date.now());
  const itemTitle = `Peluche-${tag}`;
  let qr = '';
  let toyId = '';

  function makeEan(tag: string): string {
    const base = (`299${tag}`.replace(/\D/g, '').slice(-12)).padStart(12, '0').slice(0, 12);
    const sum = [...base].reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0);
    return base + String((10 - (sum % 10)) % 10);
  }

  test('staff registers child, slot, and inventory item', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/toys', { waitUntil: 'load' });
    await page.getByTestId('toys-console').waitFor({ timeout: 15000 });

    await page.getByTestId('toys-child-label').fill(`N-${tag}`);
    await page.getByTestId('toys-child-add').click();
    await expect(page.getByTestId('toys-child-result')).toContainText('ok:');

    await page.getByTestId('toys-slot-add').click();
    await expect(page.getByTestId('toys-slot-result')).toContainText('ok:');

    await page.goto('/es/admin/toys/stock', { waitUntil: 'load' });
    await page.getByTestId('toys-stock-page').waitFor({ timeout: 15000 });

    await page.getByTestId('toys-add-open').click();
    await page.getByTestId('toys-edit-modal').waitFor({ timeout: 15000 });
    const editResult = page.getByTestId('toys-edit-result');

    // Pictures picked before saving travel with the create call.
    const png = (name: string) => ({
      name,
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByTestId('toys-edit-upload').setInputFiles([png('foto.png'), png('foto2.png')]);
    await expect(page.getByTestId('toys-edit-pending')).toContainText('Fotos: 2');

    await page.getByTestId('toys-edit-ean').fill(makeEan(tag));
    await page.getByTestId('toys-edit-title').fill(itemTitle);
    await page.getByTestId('toys-edit-desc').fill(`Para niños de 5 años ${tag}`);
    await page.getByTestId('toys-edit-save').click();
    await expect(editResult).toContainText('ok:', { timeout: 15000 });
    toyId = ((await editResult.textContent()) ?? '').replace('ok:', '').trim();
    expect(toyId.length).toBeGreaterThan(0);

    const radios = page.locator('[data-testid^="toys-edit-cover-"]');
    await expect(radios).toHaveCount(2);
    await radios.nth(1).click();
    await expect(editResult).toContainText('Portada:');
    await page.getByTestId('toys-edit-cancel').click();
  });

  test('eligibility from beneficiaries list or csv upload', async ({ page, request }) => {
    const { authToken, csrfToken } = await adminLogin(request);
    const headers = { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' };
    const member = await request.fetch(`${BACKEND_URL}/api/members`, {
      method: 'POST',
      headers,
      data: { fullName: `Fam-${tag}`, email: `fam-${tag}@test.com` },
    });
    expect(member.ok()).toBeTruthy();

    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/toys', { waitUntil: 'load' });
    await page.getByTestId('toys-console').waitFor({ timeout: 15000 });

    await page.getByTestId('toys-beneficiaries-load').click();
    await page.getByTestId('toys-beneficiary').click();
    await page.getByRole('option', { name: new RegExp(`Fam-${tag}`) }).click();
    await page.getByTestId('toys-beneficiary-pick').click();
    await expect(page.getByTestId('toys-child-result')).toContainText('ok:');

    await page.getByTestId('toys-upload-file').setInputFiles({
      name: 'lista.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('nombre,edad\nN-1,5\nN-2,mal\n', 'utf-8'),
    });
    await expect(page.getByTestId('toys-child-result')).toContainText('Creados: 1');
  });

  test('parent browses by age, checks out one QR, and books a slot', async ({ page }) => {
    await page.goto('/es/juguetes', { waitUntil: 'load' });
    await page.getByTestId('juguetes-console').waitFor({ timeout: 15000 });

    await expect(page.getByTestId('juguetes-out')).toContainText('elementos');
    await expect(page.getByTestId('juguetes-clusters')).toBeVisible();
    await page.getByTestId('juguetes-search').fill('cometa');
    await expect(page.getByTestId('juguetes-clusters')).toContainText('Cometa');
    await expect(page.getByTestId('juguetes-clusters')).not.toContainText('Xilófono');
    await page.getByTestId('juguetes-search').fill('');
    await expect(page.getByTestId('juguetes-clusters')).toContainText('Xilófono');
    await page.getByTestId('juguetes-agefilter').selectOption('y5_7');
    await expect(page.getByTestId('juguetes-grid')).toBeVisible();
    await page.getByTestId('juguetes-agefilter').selectOption('');
    await expect(page.getByTestId('juguetes-clusters')).toBeVisible();
    await expect(page.getByText(`Para niños de 5 años ${tag}`).first()).toBeVisible();
    await page.locator('[data-testid^="juguetes-zoom-"]').first().click();
    await expect(page.getByTestId('juguetes-modal')).toBeVisible();
    await expect(page.getByTestId('juguetes-modal-img')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(page.getByTestId('juguetes-age')).toBeHidden();
    expect(await page.locator('[data-testid^="juguetes-img-"]').count()).toBeGreaterThan(0);

    await page.getByTestId('juguetes-search').fill(itemTitle);
    const card = page.locator('[data-testid^="juguetes-card-"]').first();
    await expect(card).toContainText(itemTitle);
    const cardId = (await card.getAttribute('data-testid'))?.replace('juguetes-card-', '');
    const addBtn = page.getByTestId(`juguetes-add-${cardId}`);
    await expect(addBtn).toBeDisabled();
    await page.getByTestId(`juguetes-plus-${cardId}`).click();
    await page.getByTestId(`juguetes-plus-${cardId}`).click();
    await expect(page.getByTestId(`juguetes-qty-${cardId}`)).toHaveText('2');
    await addBtn.click();
    await expect(page.getByTestId(`juguetes-incart-${cardId}`)).toContainText('En cesta: 2');
    await page.getByTestId(`juguetes-remove-${cardId}`).click();
    await expect(page.getByTestId(`juguetes-incart-${cardId}`)).toHaveCount(0);
    await page.getByTestId(`juguetes-plus-${cardId}`).click();
    await addBtn.click();
    await expect(page.getByTestId('juguetes-out')).toContainText('En cesta: 1');

    await page.getByTestId('juguetes-checkout').click();
    const qrLine = page.getByTestId('juguetes-qr');
    await expect(qrLine).toContainText('QR:');
    await expect(page.getByTestId('juguetes-qr-img')).toBeVisible();
    qr = ((await qrLine.textContent()) ?? '').replace('QR:', '').trim();
    expect(qr.length).toBeGreaterThan(0);

    await page.getByTestId('juguetes-slots').click();
    await page.getByTestId('juguetes-slot').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('juguetes-book').click();
    await expect(page.getByTestId('juguetes-out')).toContainText('reservado');
  });

  test('staff edits title, description, cover, and removes a picture', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/toys/stock', { waitUntil: 'load' });
    await page.getByTestId('toys-stock-page').waitFor({ timeout: 15000 });

    await page.getByTestId('toys-stock-search').fill(itemTitle);
    await expect(page.getByTestId(`toys-row-${toyId}`)).toContainText(itemTitle);

    await page.getByTestId(`toys-edit-${toyId}`).click();
    await page.getByTestId('toys-edit-modal').waitFor({ timeout: 15000 });
    const editResult = page.getByTestId('toys-edit-result');

    await page.getByTestId('toys-edit-title').fill(`${itemTitle} grande`);
    await page.getByTestId('toys-edit-desc').fill(`Editado ${tag}`);
    await page.getByTestId('toys-edit-band').click();
    await page.getByRole('option', { name: '8-11 Años' }).click();
    await page.getByTestId('toys-edit-save').click();
    await expect(editResult).toContainText(`${itemTitle} grande`);

    const rowCovers = page.locator('[data-testid^="toys-edit-cover-"]');
    await expect(rowCovers).toHaveCount(2);
    await rowCovers.first().click();
    await expect(editResult).toContainText('Portada:');

    const removeButtons = page.locator('[data-testid^="toys-edit-remove-"]');
    await expect(removeButtons).toHaveCount(2);
    await removeButtons.first().click();
    await expect(editResult).toContainText('Quitar foto:');
    await expect(page.locator('[data-testid^="toys-edit-remove-"]')).toHaveCount(1);
    await page.getByTestId('toys-edit-cancel').click();
  });

  test('casita lightbox walks all three pictures', async ({ page }) => {
    await page.goto('/es/juguetes', { waitUntil: 'load' });
    await page.getByTestId('juguetes-console').waitFor({ timeout: 15000 });
    await expect(page.getByTestId('juguetes-clusters')).toBeVisible();
    const card = page.locator('[data-testid^="juguetes-card-"]', { hasText: 'Casita de muñecas' }).first();
    await card.locator('[data-testid^="juguetes-zoom-"]').click();
    await expect(page.getByTestId('juguetes-modal')).toBeVisible();
    await expect(page.getByTestId('juguetes-modal-desc')).toContainText('Casita con muebles');
    await expect(page.getByTestId('juguetes-modal-count')).toHaveText('1 / 3');
    await page.getByTestId('juguetes-modal-next').click();
    await expect(page.getByTestId('juguetes-modal-count')).toHaveText('2 / 3');
    await page.getByTestId('juguetes-modal-next').click();
    await expect(page.getByTestId('juguetes-modal-count')).toHaveText('3 / 3');
    await expect(page.getByTestId('juguetes-modal-img')).toBeVisible();
    await page.keyboard.press('Escape');
    await card.getByText('Casita con muebles').click();
    await expect(page.getByTestId('juguetes-modal')).toBeVisible();
    await expect(page.getByTestId('juguetes-modal-desc')).toContainText('Casita con muebles');
  });

  test('handoff scan collects, double scan refuses, close records destination', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/toys', { waitUntil: 'load' });
    await page.getByTestId('toys-console').waitFor({ timeout: 15000 });

    await page.getByTestId('toys-scan-token').fill(qr);
    await page.getByTestId('toys-scan-run').click();
    await expect(page.getByTestId('toys-scan-result')).toContainText('collected:');

    await page.getByTestId('toys-scan-run').click();
    await expect(page.getByTestId('toys-scan-result')).toContainText(/ERROR|collected: 0/i);

    await page.getByTestId('toys-close-toy').fill(toyId);
    await page.getByTestId('toys-close-dest').fill('almacén central e2e');
    await page.getByTestId('toys-close-run').click();
    await expect(page.getByTestId('toys-close-result')).toContainText('almacén central e2e');
  });
});
