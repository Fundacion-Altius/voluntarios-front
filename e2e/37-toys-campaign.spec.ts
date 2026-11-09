import { test, expect, type Page } from '@playwright/test';
import { loginAsBrowser } from './helpers';
import {
  adminToysApi,
  cleanupSince,
  familyRow,
  familyWithOrder,
  itemQuantity,
  makeEan,
  snapshot,
  toysApi,
  type Snapshot,
  type ToysApi,
} from './toysData';

/**
 * Toys campaign redesign (Altius): modo reparto, turnos, familias y niños,
 * inventario and cierre. Runs against its own e2e-tagged data and removes it
 * afterwards, so the demo seed is left untouched.
 */
test.describe('Toys campaign redesign', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  const tag = Date.now().toString(36);
  const famA = `e2ea-${tag}`; // order to hand over
  const famB = `e2eb-${tag}`; // order with a problem note
  const famC = `e2ec-${tag}`; // no order yet
  const toyTitle = `E2E juguete ${tag}`;
  let api: ToysApi;
  let before: Snapshot;
  let toyId = '';
  let qrB = '';

  test.beforeAll(async () => {
    api = await adminToysApi();
    before = await snapshot(api);
    const item = await api.post('/items', { title: toyTitle, ageBand: 'y5_7', quantity: 5, location: 'almacen', ean: makeEan(tag) });
    expect(item.status()).toBe(201);
    toyId = (await item.json()).id;
    await familyWithOrder(api, famA, toyId);
    qrB = await familyWithOrder(api, famB, toyId);
    await familyWithOrder(api, famC);
  });

  test.afterAll(async () => {
    await cleanupSince(api, before, tag);
    await api.dispose();
  });

  async function asAdmin(page: Page, path: string, testid: string) {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto(path, { waitUntil: 'load' });
    await page.getByTestId(testid).waitFor({ timeout: 30000 });
  }

  async function lookup(page: Page, code: string) {
    await page.getByTestId('toys-reparto-code').fill(code);
    await page.getByTestId('toys-reparto-lookup').click();
  }

  async function shownWeekStart(page: Page): Promise<string> {
    const first = page.locator('[data-testid^="toys-day-"]').first();
    await first.waitFor();
    return ((await first.getAttribute('data-testid')) ?? '').replace('toys-day-', '');
  }

  test.describe('primary flows', () => {
    test('overview shows the real delivered count and links to every screen', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys', 'toys-header');
      for (const tab of ['inventario', 'familias', 'turnos', 'entrega', 'cierre']) {
        await expect(page.getByTestId(`toys-tab-${tab}`)).toBeVisible();
      }
      await page.getByTestId('toys-tab-entrega').click();
      await expect(page).toHaveURL(/\/es\/admin\/toys\/entrega$/);
      await expect(page.getByTestId('toys-reparto-delivered')).toHaveText(/^\d+$/);
    });

    test('modo reparto looks up a family without delivering, then Entregado confirms', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/entrega', 'toys-reparto');
      const delivered = page.getByTestId('toys-reparto-delivered');
      await expect(delivered).toHaveText(/^\d+$/);
      const deliveredBefore = Number(await delivered.textContent());
      const stockBefore = await itemQuantity(api, toyId);

      await lookup(page, famA);
      await expect(page.getByTestId('toys-reparto-family')).toContainText(famA.toUpperCase());
      await expect(page.getByTestId(`toys-reparto-line-${toyId}`)).toContainText(toyTitle);
      expect((await familyRow(api, famA))?.status).not.toBe('recogido');
      expect(await itemQuantity(api, toyId)).toBe(stockBefore);

      await page.getByTestId('toys-reparto-confirm').click();
      await expect(page.getByTestId('toys-reparto-result')).toContainText('¡Entregado!');
      await expect(delivered).toHaveText(String(deliveredBefore + 1));
      expect((await familyRow(api, famA))?.status).toBe('recogido');
      expect(await itemQuantity(api, toyId)).toBe(stockBefore - 1);

      await page.getByTestId('toys-reparto-next').click();
      await expect(page.getByTestId('toys-reparto-result')).toHaveCount(0);
      await expect(page.getByTestId('toys-reparto-code')).toHaveValue('');
    });

    test('modo reparto finds an order by QR token and records, then clears, a problem note', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/entrega', 'toys-reparto');
      await lookup(page, qrB);
      await expect(page.getByTestId('toys-reparto-family')).toContainText(famB.toUpperCase());

      await page.getByTestId('toys-reparto-problem-open').click();
      await page.getByTestId('toys-reparto-problem-note').fill('Falta la caja (e2e)');
      await page.getByTestId('toys-reparto-problem-save').click();
      await expect(page.getByTestId('toys-reparto-problem-saved')).toContainText('Falta la caja (e2e)');
      await expect(page.getByTestId('toys-reparto-problem-note')).toHaveCount(0);
      const noted = await familyRow(api, famB);
      expect(noted?.problem_note).toBe('Falta la caja (e2e)');
      expect(noted?.status).not.toBe('recogido');

      await page.getByTestId('toys-reparto-problem-open').click();
      await page.getByTestId('toys-reparto-problem-note').fill('');
      await page.getByTestId('toys-reparto-problem-save').click();
      await expect(page.getByTestId('toys-reparto-problem-note')).toHaveCount(0);
      await expect(page.getByTestId('toys-reparto-problem-saved')).toHaveCount(0);
      await expect.poll(async () => (await familyRow(api, famB))?.problem_note ?? null).toBeNull();
    });

    test('turnos adds, edits and deletes a slot from the slide-over', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/turnos', 'toys-week');
      const day = await shownWeekStart(page);
      const label = `E2E turno ${tag}`;

      await page.getByTestId(`toys-slot-add-${day}`).click();
      const panel = page.getByTestId('toys-slot-panel');
      await expect(panel).toBeVisible();
      await expect(page.getByTestId('toys-slot-date')).toHaveValue(day);
      await page.getByTestId('toys-slot-start').fill('09:00');
      await page.getByTestId('toys-slot-end').fill('10:30');
      await page.getByTestId('toys-slot-capacity').fill('2');
      await page.getByTestId('toys-slot-label').fill(label);
      await page.getByTestId('toys-slot-save').click();
      await expect(panel).toBeHidden();

      const card = page.getByTestId(`toys-day-${day}`).locator('[data-testid^="toys-slot-"]', { hasText: label });
      await expect(card).toContainText('09:00');
      await expect(card).toContainText('0 de 2 familias');

      await card.click();
      await page.getByTestId('toys-slot-capacity').fill('3');
      await page.getByTestId('toys-slot-save').click();
      await expect(card).toContainText('0 de 3 familias');

      await card.click();
      await page.getByTestId('toys-slot-delete').click();
      await expect(page.getByTestId('toys-slot-delete-dialog')).toBeVisible();
      await page.getByTestId('toys-slot-delete-confirm').click();
      await expect(panel).toBeHidden();
      await expect(page.getByText(label)).toHaveCount(0);
    });

    test('familias adds a family, filters by status, edits its quota and deletes it', async ({ page }) => {
      const code = `e2ex-${tag}`;
      await asAdmin(page, '/es/admin/toys/familias', 'toys-familias');
      await expect(page.getByTestId(`toys-fam-status-${famA}`)).toHaveText('Recogido');

      await page.getByTestId('toys-family-add').click();
      await page.getByTestId('toys-family-code').fill(code);
      await page.getByTestId('toys-family-quota').fill('2');
      await page.getByTestId('toys-family-save').click();
      await expect(page.getByTestId('toys-fam-notice')).toContainText(code.toUpperCase());
      await expect(page.getByTestId(`toys-fam-status-${code}`)).toHaveText('Inscrita');

      await page.getByTestId('toys-fam-filter-recogido').click();
      await expect(page.getByTestId(`toys-fam-row-${code}`)).toHaveCount(0);
      await expect(page.getByTestId(`toys-fam-row-${famA}`)).toBeVisible();
      await page.getByTestId('toys-fam-filter-all').click();
      await page.getByTestId('toys-fam-search').fill(code);
      await expect(page.locator('[data-testid^="toys-fam-row-"]')).toHaveCount(1);

      await page.getByTestId(`toys-fam-edit-${code}`).click();
      await page.getByTestId('toys-family-quota').fill('4');
      await page.getByTestId('toys-family-save').click();
      await expect(page.getByTestId(`toys-fam-row-${code}`)).toContainText('4 juguetes');

      await page.getByTestId(`toys-fam-edit-${code}`).click();
      await page.getByTestId('toys-family-delete').click();
      await page.getByTestId('toys-family-delete-confirm').click();
      await expect(page.getByTestId(`toys-fam-row-${code}`)).toHaveCount(0);
      expect(await familyRow(api, code)).toBeUndefined();
    });

    test('niños adds, edits and deletes a child', async ({ page }) => {
      const label = `E2E niño ${tag}`;
      await asAdmin(page, '/es/admin/toys/familias', 'toys-familias');
      await page.getByTestId('toys-fam-tab-ninos').click();
      await page.getByTestId('toys-child-add').click();
      await page.getByTestId('toys-child-label').fill(label);
      await page.getByTestId('toys-child-age').fill('6');
      await page.getByTestId('toys-child-save').click();

      await page.getByTestId('toys-child-search').fill(label);
      const row = page.locator('[data-testid^="toys-child-row-"]', { hasText: label });
      await expect(row).toContainText('6 años');

      await row.locator('[data-testid^="toys-child-edit-"]').click();
      await page.getByTestId('toys-child-age').fill('9');
      await page.getByTestId('toys-child-save').click();
      await expect(row).toContainText('9 años');

      await row.locator('[data-testid^="toys-child-edit-"]').click();
      await page.getByTestId('toys-child-delete').click();
      await page.getByTestId('toys-child-delete-confirm').click();
      await expect(row).toHaveCount(0);
    });

    test('niños csv import shows a preview before anything is saved', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/familias', 'toys-familias');
      const childrenBefore = (await (await api.get('/children')).json()).length;
      await page.getByTestId('toys-fam-tab-ninos').click();
      await page.getByTestId('toys-child-import').click();
      await page.getByTestId('toys-import-file').setInputFiles({
        name: 'lista.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(`nombre,edad\nE2E csv ${tag},4\nE2E mal ${tag},mal\n`, 'utf-8'),
      });
      await expect(page.getByTestId('toys-import-preview')).toContainText('Se crearán 1 niño');
      await expect(page.getByTestId('toys-import-preview')).toContainText(`E2E csv ${tag}`);
      expect((await (await api.get('/children')).json()).length).toBe(childrenBefore);

      await page.getByTestId('toys-import-confirm').click();
      await expect(page.getByTestId('toys-fam-notice')).toContainText('Importados: 1');
      await page.getByTestId('toys-child-search').fill(`E2E csv ${tag}`);
      await expect(page.locator('[data-testid^="toys-child-row-"]')).toHaveCount(1);
    });

    test('inventario + and − change stock by exactly one', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/stock', 'toys-stock-page');
      await page.getByTestId('toys-stock-search').fill(toyTitle);
      const start = await itemQuantity(api, toyId);
      await expect(page.getByTestId(`toys-qty-${toyId}`)).toContainText(String(start));
      await page.getByTestId(`toys-qty-plus-${toyId}`).click();
      await expect(page.getByTestId(`toys-qty-${toyId}`)).toContainText(String(start + 1));
      await expect.poll(() => itemQuantity(api, toyId)).toBe(start + 1);
      await page.getByTestId(`toys-qty-minus-${toyId}`).click();
      await expect(page.getByTestId(`toys-qty-${toyId}`)).toContainText(String(start));
      await expect.poll(() => itemQuantity(api, toyId)).toBe(start);
    });

    test('cierre redistributes one picked toy after confirming, and can undo it', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/cierre', 'toys-close-list');
      const left = await itemQuantity(api, toyId);
      await page.getByTestId('toys-close-none').click();
      await page.getByTestId(`toys-close-include-${toyId}`).check();
      await page.getByTestId(`toys-close-kind-${toyId}`).selectOption('redistributed');
      await page.getByTestId('toys-close-destination').fill(`Entidad e2e ${tag}`);
      await expect(page.getByTestId('toys-close-plan')).toContainText(`0 se guardan · ${left} se redistribuyen`);

      await page.getByTestId('toys-close-open').click();
      const dialog = page.getByTestId('toys-close-dialog');
      await expect(dialog).toContainText(`Entidad e2e ${tag}`);
      await expect(page.getByTestId('toys-close-warning')).toBeVisible();
      await page.getByTestId('toys-close-confirm').click();
      await expect(page.getByTestId('toys-close-result')).toContainText('Listo: 1 juguete apuntado');

      const closures = (await (await api.get('/dispositions')).json()) as { id: string; toy_id: string; kind: string; quantity: number }[];
      const mine = closures.find((d) => d.toy_id === toyId);
      expect(mine).toMatchObject({ kind: 'redistributed', quantity: left });
      await expect(page.getByTestId(`toys-close-row-${toyId}`)).toHaveCount(0);

      await page.getByTestId(`toys-close-undo-${mine?.id}`).click();
      await expect(page.getByTestId('toys-close-result')).toContainText('Cierre deshecho');
      await expect(page.getByTestId(`toys-close-row-${toyId}`)).toBeVisible();
    });

    test('the new screens speak Catalan', async ({ page }) => {
      await asAdmin(page, '/ca/admin/toys/entrega', 'toys-reparto');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mode repartiment');
      await lookup(page, famC);
      await expect(page.getByTestId('toys-reparto-error')).toContainText('No trobem aquest codi');
      await page.goto('/ca/admin/toys/cierre', { waitUntil: 'load' });
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tancament de la campanya');
    });
  });

  test.describe('exception flows', () => {
    test('modo reparto refuses an empty code, an unknown code and an order already delivered', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/entrega', 'toys-reparto');
      const error = page.getByTestId('toys-reparto-error');
      await lookup(page, '');
      await expect(error).toHaveAttribute('data-error', 'empty');
      await lookup(page, `nadie-${tag}`);
      await expect(error).toHaveAttribute('data-error', 'not_found');
      await expect(error).toContainText('No encontramos ese código');

      const stock = await itemQuantity(api, toyId);
      await lookup(page, famA);
      await expect(page.getByTestId('toys-reparto-result')).toContainText('Ya se entregó');
      await expect(page.getByTestId('toys-reparto-confirm')).toHaveCount(0);
      expect(await itemQuantity(api, toyId)).toBe(stock);
    });

    test('turnos blocks deleting a booked slot, shrinking it below its bookings and ending before it starts', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/turnos', 'toys-week');
      const day = await shownWeekStart(page);
      const label = `E2E lleno ${tag}`;
      const slot = await (await api.post('/slots', { date: day, label, start_time: '11:00', end_time: '12:00', capacity: 2 })).json();
      expect((await api.post(`/slots/${slot.id}/book`, { household_id: famB })).status()).toBe(201);
      expect((await api.post(`/slots/${slot.id}/book`, { household_id: famC })).status()).toBe(201);
      await page.reload();

      const card = page.getByTestId(`toys-slot-${slot.id}`);
      await expect(card).toContainText('2 de 2 familias');
      await expect(card).toContainText('Completo');
      await card.click();
      await expect(page.getByTestId('toys-slot-booked')).toContainText('2 familias han reservado');

      await page.getByTestId('toys-slot-capacity').fill('1');
      await page.getByTestId('toys-slot-save').click();
      await expect(page.getByTestId('toys-slot-error')).toContainText('No puedes poner menos plazas que reservas');

      await page.getByTestId('toys-slot-capacity').fill('2');
      await page.getByTestId('toys-slot-end').fill('10:00');
      await page.getByTestId('toys-slot-save').click();
      await expect(page.getByTestId('toys-slot-error')).toContainText('La hora de fin tiene que ser después');

      await page.getByTestId('toys-slot-delete').click();
      await page.getByTestId('toys-slot-delete-confirm').click();
      await expect(page.getByTestId('toys-slot-error')).toContainText('No se puede borrar: 2 familias han reservado');
      expect((await (await api.get('/slots')).json()).some((s: { id: string }) => s.id === slot.id)).toBe(true);

      const full = await api.post(`/slots/${slot.id}/book`, { household_id: famA });
      expect(full.status()).toBe(409);
    });

    test('familias refuses a duplicate code and a child without a valid age', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/familias', 'toys-familias');
      await page.getByTestId('toys-family-add').click();
      await page.getByTestId('toys-family-code').fill(famC);
      await page.getByTestId('toys-family-save').click();
      await expect(page.getByTestId('toys-family-error')).toContainText('Ese código ya existe');
      await page.getByTestId('toys-family-cancel').click();

      await page.getByTestId('toys-fam-tab-ninos').click();
      await page.getByTestId('toys-child-add').click();
      await page.getByTestId('toys-child-label').fill(`E2E sin edad ${tag}`);
      await page.getByTestId('toys-child-save').click();
      await expect(page.getByTestId('toys-child-error')).toContainText('Escribe una etiqueta y una edad válida');
    });

    test('cierre records nothing without a destination or when the dialog is cancelled', async ({ page }) => {
      await asAdmin(page, '/es/admin/toys/cierre', 'toys-close-list');
      const closures = (await (await api.get('/dispositions')).json()).length;
      await page.getByTestId('toys-close-none').click();
      await page.getByTestId('toys-close-open').click();
      await expect(page.getByTestId('toys-close-result')).toContainText('Escribe dónde van los juguetes');

      await page.getByTestId('toys-close-destination').fill(`Almacén e2e ${tag}`);
      await page.getByTestId('toys-close-open').click();
      await expect(page.getByTestId('toys-close-result')).toContainText('Marca al menos un juguete');
      await expect(page.getByTestId('toys-close-dialog')).toHaveCount(0);

      await page.getByTestId(`toys-close-include-${toyId}`).check();
      await page.getByTestId('toys-close-open').click();
      await page.getByTestId('toys-close-cancel').click();
      await expect(page.getByTestId('toys-close-dialog')).toHaveCount(0);
      expect((await (await api.get('/dispositions')).json()).length).toBe(closures);
    });

    test('stock never goes below zero', async () => {
      const item = await api.post('/items', { title: `E2E cero ${tag}`, ageBand: 'y1_2', quantity: 1, location: 'almacen', ean: makeEan(`${tag}9`) });
      const id = (await item.json()).id;
      await api.post(`/items/${id}/adjust`, { delta: -1 });
      const again = await api.post(`/items/${id}/adjust`, { delta: -1 });
      expect(again.ok()).toBe(true);
      expect(await itemQuantity(api, id)).toBe(0);
    });

    test('roles: a volunteer can hand out but not change stock; others are refused', async () => {
      const volunteer = await toysApi('general@fundacionaltius.org', 'general123');
      const user = await toysApi('nave@fundacionaltius.org', 'nave123');
      const anonymous = await toysApi();
      try {
        expect((await volunteer.post('/scan/lookup', { token: famB })).status()).toBe(200);
        expect((await volunteer.get('/handover/summary')).status()).toBe(200);
        expect((await volunteer.post(`/items/${toyId}/adjust`, { delta: 1 })).status()).toBe(403);
        expect((await volunteer.post('/households', { code: `e2ev-${tag}` })).status()).toBe(403);
        expect((await user.post('/scan/lookup', { token: famB })).status()).toBe(403);
        // Anonymous calls never get through (401 without a session, 403 once the CSRF guard has a cookie to compare).
        expect([401, 403]).toContain((await anonymous.post('/scan/lookup', { token: famB })).status());
        expect([401, 403]).toContain((await anonymous.post('/scan/confirm', { token: famB })).status());
        expect((await familyRow(api, famB))?.status).not.toBe('recogido');
      } finally {
        await Promise.all([volunteer.dispose(), user.dispose(), anonymous.dispose()]);
      }
    });
  });
});
