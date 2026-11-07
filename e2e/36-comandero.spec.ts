import { expect, test } from '@playwright/test';
import { adminLogin, authHeaders, BACKEND_URL, loginAsBrowser } from './helpers';

/**
 * Comandero (KL-E-022) end-to-end.
 *
 * Covers the teacher flow through the admin UI (carta → sesión → mesa → sala),
 * then exercises the full order cycle (abrir → añadir → preparar → listo →
 * servir → cerrar) through the backend API and asserts the subtotal and the
 * closed state. The module is behind the `comandero` tenant flag, which
 * defaults ON in development (the e2e webServer runs `pnpm dev`).
 *
 * Requires backend on :3001 and frontend on :3000 (Playwright starts the front).
 * Run visually with: pnpm test:e2e --ui
 */
test.describe('Comandero training simulator (browser)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const tag = String(Date.now());

  test('teacher builds carta, starts a session and sees the floor', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/comandero', { waitUntil: 'load' });
    await page.getByTestId('comandero-admin').waitFor({ timeout: 15000 });

    // Carta del aula: add a dish and a drink.
    await page.getByTestId('comandero-item-name').fill(`Croquetas ${tag}`);
    await page.getByTestId('comandero-item-price').fill('6');
    await page.getByTestId('comandero-item-add').click();
    await expect(page.getByTestId('comandero-menu-row')).toHaveCount(1, { timeout: 15000 });

    await page.getByTestId('comandero-item-name').fill(`Caña ${tag}`);
    await page.getByTestId('comandero-item-price').fill('2.5');
    await page.getByTestId('comandero-item-add').click();
    await expect(page.getByTestId('comandero-menu-row')).toHaveCount(2);

    // Start a practice session and add a table.
    await page.getByTestId('comandero-session-label').fill(`Servicio ${tag}`);
    await page.getByTestId('comandero-session-start').click();
    await page.getByTestId('comandero-table-label').waitFor({ timeout: 15000 });

    await page.getByTestId('comandero-table-label').fill('Mesa 1');
    await page.getByTestId('comandero-table-add').click();

    // The floor view (polling) shows the table.
    await expect(page.getByTestId('comandero-floor-table').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Mesa 1')).toBeVisible();
  });

  test('full order cycle via API: open, route, prepare, serve, close subtotal', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);
    const headers = { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' };
    const api = `${BACKEND_URL}/api/comandero`;

    // Carta
    const plato = await (
      await request.fetch(`${api}/menu`, {
        method: 'POST',
        headers,
        data: { name: `Tortilla ${tag}`, category: 'plato', price_cents: 700 },
      })
    ).json();
    const bebida = await (
      await request.fetch(`${api}/menu`, {
        method: 'POST',
        headers,
        data: { name: `Agua ${tag}`, category: 'bebida', price_cents: 150 },
      })
    ).json();
    expect(plato.id).toBeTruthy();
    expect(bebida.id).toBeTruthy();

    // Sesión + snapshot
    const session = await (
      await request.fetch(`${api}/sessions`, { method: 'POST', headers, data: { label: `API ${tag}` } })
    ).json();
    const snapshot = await (await request.fetch(`${api}/sessions/${session.id}/snapshot`, { headers })).json();
    const snapPlato = snapshot.find((s: { source_item_id: string }) => s.source_item_id === plato.id);
    const snapBebida = snapshot.find((s: { source_item_id: string }) => s.source_item_id === bebida.id);
    expect(snapPlato.station).toBe('cocina');
    expect(snapBebida.station).toBe('barra');

    // Mesa + comanda
    const table = await (
      await request.fetch(`${api}/sessions/${session.id}/tables`, { method: 'POST', headers, data: { label: 'Mesa A' } })
    ).json();
    const order = await (await request.fetch(`${api}/tables/${table.id}/order`, { method: 'POST', headers, data: {} })).json();
    expect(order.status).toBe('abierta');

    // A second open order on the same table is rejected (409).
    const dup = await request.fetch(`${api}/tables/${table.id}/order`, { method: 'POST', headers, data: {} });
    expect(dup.status()).toBe(409);

    // Add lines and walk each through the station states, then serve.
    for (const snap of [snapPlato, snapBebida]) {
      const line = await (
        await request.fetch(`${api}/orders/${order.id}/lines`, {
          method: 'POST',
          headers,
          data: { snapshot_item_id: snap.id, note: 'sin sal' },
        })
      ).json();
      await request.fetch(`${api}/lines/${line.id}/advance`, { method: 'POST', headers, data: {} }); // en_preparacion
      await request.fetch(`${api}/lines/${line.id}/advance`, { method: 'POST', headers, data: {} }); // listo
      const served = await request.fetch(`${api}/lines/${line.id}/serve`, { method: 'POST', headers, data: {} });
      expect(served.ok()).toBeTruthy();
    }

    // Close the bill: subtotal is the sum, no real charge.
    const closed = await (await request.fetch(`${api}/orders/${order.id}/close`, { method: 'POST', headers, data: {} })).json();
    expect(closed.status).toBe('cerrada');
    expect(closed.subtotal_cents).toBe(850);

    // Close the session and get a summary.
    const summary = await (
      await request.fetch(`${api}/sessions/${session.id}/close`, {
        method: 'POST',
        headers,
        data: { student_role: 'camarero', teacher_note: 'ok' },
      })
    ).json();
    expect(summary.service_order.length).toBe(2);
  });
});
