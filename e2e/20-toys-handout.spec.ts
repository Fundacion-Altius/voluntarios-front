import { test, expect } from '@playwright/test';
import { loginAsBrowser } from './helpers';
import { adminToysApi, cleanupSince, makeEan, snapshot, tinyPng, type Snapshot, type ToysApi } from './toysData';

test.describe('December toys handout (browser)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const tag = String(Date.now());
  const itemTitle = `Peluche-${tag}`;
  let qr = '';
  let toyId = '';
  // The parent flow needs a family code since the /juguetes entry gate.
  const family = `e2e${tag}`.slice(0, 16);
  let api: ToysApi;
  let before: Snapshot;

  // Everything this spec creates is removed afterwards, so the demo seed stays as it was.
  test.beforeAll(async () => {
    api = await adminToysApi();
    before = await snapshot(api);
    const res = await api.post('/households', { code: family, toy_quota: 3 });
    expect(res.status()).toBe(201);
    const slot = await api.post('/slots', { date: '2026-12-15', label: `Turno e2e ${tag}`, start_time: '10:00', end_time: '12:00' });
    expect(slot.status()).toBe(201);
    // Catalogue fixtures of its own, so the spec does not depend on which seed is loaded.
    const fixtures = [
      { title: `Cometa ${tag}`, ageBand: 'y5_7', pictures: 1, description: `Cometa de colores ${tag}` },
      { title: `Xilófono ${tag}`, ageBand: 'y1_2', pictures: 1, description: `Xilófono de madera ${tag}` },
      { title: `Casita ${tag}`, ageBand: 'y5_7', pictures: 3, description: `Casita con muebles ${tag}` },
    ];
    for (const [i, f] of fixtures.entries()) {
      const item = await api.post('/items', { title: f.title, ageBand: f.ageBand, quantity: 3, location: 'almacen', description: f.description, ean: makeEan(`${tag}${i + 1}`) });
      expect(item.status()).toBe(201);
      const id = (await item.json()).id;
      for (let n = 1; n <= f.pictures; n++) {
        expect((await api.upload(`/items/${id}/pictures`, 'pictures', tinyPng(`foto-${n}.png`))).ok()).toBeTruthy();
      }
    }
  });

  test.afterAll(async () => {
    await cleanupSince(api, before, tag);
    await api.dispose();
  });

  test('staff registers an inventory item with pictures', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
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
    await expect(editResult).toHaveAttribute('data-item-id', /.+/, { timeout: 15000 });
    toyId = (await editResult.getAttribute('data-item-id')) ?? '';
    expect(toyId.length).toBeGreaterThan(0);

    const radios = page.locator('[data-testid^="toys-edit-cover-"]');
    await expect(radios).toHaveCount(2);
    // The radio is visually hidden; click its star label.
    await radios.nth(1).locator('xpath=..').click();
    await expect(editResult).toContainText('Portada cambiada');
    await page.getByTestId('toys-edit-cancel').click();
  });

  test('parent browses by age, checks out one QR, and books a slot', async ({ page }) => {
    await page.goto('/es/juguetes', { waitUntil: 'load' });
    await page.getByTestId('juguetes-console').waitFor({ timeout: 15000 });
    await page.getByTestId('juguetes-code').fill(family);
    await page.getByTestId('juguetes-code-go').click();

    await expect(page.getByTestId('juguetes-out')).toContainText('elementos');
    await expect(page.getByTestId('juguetes-grid')).toBeVisible();
    await page.getByTestId('juguetes-search').fill(`cometa ${tag}`);
    await expect(page.getByTestId('juguetes-grid')).toContainText(`Cometa ${tag}`);
    await expect(page.getByTestId('juguetes-grid')).not.toContainText(`Xilófono ${tag}`);
    await page.getByTestId('juguetes-search').fill(tag);
    await expect(page.getByTestId('juguetes-grid')).toContainText(`Xilófono ${tag}`);
    await page.getByTestId('juguetes-age-y5_7').click();
    await expect(page.getByTestId('juguetes-age-y5_7')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('juguetes-age-all').click();
    await expect(page.getByTestId('juguetes-age-all')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(`Para niños de 5 años ${tag}`).first()).toBeVisible();
    await page.getByTestId('juguetes-search').fill('');
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
    await page.getByRole('option', { name: new RegExp(`Turno e2e ${tag}`) }).click();
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
    await page.getByTestId('toys-edit-band-y8_11').click();
    await page.getByTestId('toys-edit-save').click();
    await expect(editResult).toContainText(`${itemTitle} grande`);

    const rowCovers = page.locator('[data-testid^="toys-edit-cover-"]');
    await expect(rowCovers).toHaveCount(2);
    await rowCovers.first().locator('xpath=..').click();
    await expect(editResult).toContainText('Portada cambiada');

    const removeButtons = page.locator('[data-testid^="toys-edit-remove-"]');
    await expect(removeButtons).toHaveCount(2);
    await removeButtons.first().click();
    await expect(editResult).toContainText('Foto quitada');
    await expect(page.locator('[data-testid^="toys-edit-remove-"]')).toHaveCount(1);
    await page.getByTestId('toys-edit-cancel').click();
  });

  test('casita lightbox walks all three pictures', async ({ page }) => {
    await page.goto('/es/juguetes', { waitUntil: 'load' });
    await page.getByTestId('juguetes-console').waitFor({ timeout: 15000 });
    await page.getByTestId('juguetes-code').fill(family);
    await page.getByTestId('juguetes-code-go').click();
    await expect(page.getByTestId('juguetes-grid')).toBeVisible();
    await page.getByTestId('juguetes-search').fill(`casita ${tag}`);
    const card = page.locator('[data-testid^="juguetes-card-"]', { hasText: `Casita ${tag}` }).first();
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

  test('modo reparto hands the parent's order over once', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/toys/entrega', { waitUntil: 'load' });
    await page.getByTestId('toys-reparto').waitFor({ timeout: 15000 });

    await page.getByTestId('toys-reparto-code').fill(qr);
    await page.getByTestId('toys-reparto-lookup').click();
    await expect(page.getByTestId(`toys-reparto-line-${toyId}`)).toBeVisible();
    await page.getByTestId('toys-reparto-confirm').click();
    await expect(page.getByTestId('toys-reparto-result')).toContainText('¡Entregado!');

    await page.getByTestId('toys-reparto-next').click();
    await page.getByTestId('toys-reparto-code').fill(qr);
    await page.getByTestId('toys-reparto-lookup').click();
    await expect(page.getByTestId('toys-reparto-result')).toContainText('Ya se entregó');
    await expect(page.getByTestId('toys-reparto-confirm')).toHaveCount(0);
  });
});
