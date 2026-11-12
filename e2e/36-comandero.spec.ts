import { expect, type Page, request as apiContext, test } from '@playwright/test';
import { adminLogin, authHeaders, loginAsBrowserOnHost } from './helpers';

/**
 * Comandero (KL-E-022) end-to-end — browser stories (KL-US-037…044).
 *
 * HTTP 409/403/isolation/snapshot/reclose/non-Altius Host →
 * comanderoApi.spec.ts / comanderoRolesApi.spec.ts.
 *
 * Incidental seed uses same-origin /api/comandero via the Altius front host
 * (Next rewrite), never BACKEND_URL request.fetch asserts.
 */

const base = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
const ALTIUS_ORIGIN = `${base.protocol}//fundacionaltius.localhost:${base.port || '80'}`;
const api = `${ALTIUS_ORIGIN}/api/comandero`;

// Docente = admin (drives /admin/comandero). Alumno = general (drives /portal/comandero);
// the portal layout redirects non-general roles to /admin/dashboard, so the student surfaces
// must be exercised as a general user.
const ADMIN = { email: 'admin@fundacionaltius.org', password: 'admin123' };
const STUDENT = { email: 'general@fundacionaltius.org', password: 'general123' };

// Cache the admin headers per request context: adminLogin rotates the csrf_token
// cookie on every call, so logging in again would invalidate headers captured earlier
// in the same test (the double-submit cookie no longer matches the stale header).
const headersCache = new WeakMap<object, Record<string, string>>();
async function apiHeaders(request: Parameters<typeof adminLogin>[0]) {
  const cached = headersCache.get(request as object);
  if (cached) return cached;
  const { authToken, csrfToken } = await adminLogin(request);
  const headers = { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' };
  headersCache.set(request as object, headers);
  return headers;
}

interface Seed {
  sessionId: string;
  sessionLabel: string;
  platoId: string;
  bebidaId: string;
  snapPlatoId: string;
  snapBebidaId: string;
  platoName: string;
  bebidaName: string;
}

interface Carta {
  platoId: string;
  bebidaId: string;
  platoName: string;
  bebidaName: string;
}

/** Create one uniquely-named plato (6,00) and bebida (2,50) in the tenant carta. */
async function seedCarta(request: Parameters<typeof adminLogin>[0], tag: string): Promise<Carta> {
  const headers = await apiHeaders(request);
  const platoName = `Croquetas ${tag}`;
  const bebidaName = `Cana ${tag}`;
  const plato = await (
    await request.fetch(`${api}/menu`, { method: 'POST', headers, data: { name: platoName, category: 'plato', price_cents: 600 } })
  ).json();
  const bebida = await (
    await request.fetch(`${api}/menu`, { method: 'POST', headers, data: { name: bebidaName, category: 'bebida', price_cents: 250 } })
  ).json();
  return { platoId: plato.id, bebidaId: bebida.id, platoName, bebidaName };
}

/**
 * Seed a session with a uniquely-named plato + bebida and one table.
 * Names carry the per-test `tag` so UI option selectors are unambiguous even
 * though the tenant carta is shared per tenant and accumulates across tests.
 */
async function seedSession(request: Parameters<typeof adminLogin>[0], tag: string, hold = false): Promise<Seed> {
  const headers = await apiHeaders(request);
  const carta = await seedCarta(request, tag);
  const sessionLabel = `E2E ${tag}`;
  trackSessionLabel(sessionLabel, hold);
  const session = await (
    await request.fetch(`${api}/sessions`, { method: 'POST', headers, data: { label: sessionLabel } })
  ).json();
  const snapshot = await (await request.fetch(`${api}/sessions/${session.id}/snapshot`, { headers })).json();
  await request.fetch(`${api}/sessions/${session.id}/tables`, { method: 'POST', headers, data: { label: 'Mesa 1' } });
  return {
    ...carta,
    sessionId: session.id,
    sessionLabel,
    snapPlatoId: snapshot.find((s: { source_item_id: string }) => s.source_item_id === carta.platoId).id,
    snapBebidaId: snapshot.find((s: { source_item_id: string }) => s.source_item_id === carta.bebidaId).id,
  };
}

/**
 * Services created by the test that is running. Closed in afterEach, so a failure
 * still takes them off the student picker. A label in `heldSessionLabels` is shared
 * with the next test of a serial describe and is closed in afterAll instead.
 * Anything a teacher opened by hand, including the demo service, is not in either set.
 */
const closeAfterTest = new Set<string>();
const heldSessionLabels = new Set<string>();

function trackSessionLabel(label: string, hold = false) {
  (hold ? heldSessionLabels : closeAfterTest).add(label);
}

async function closeTrackedSessions(
  request: Parameters<typeof adminLogin>[0],
  labels: Set<string>,
) {
  if (labels.size === 0) return;
  const headers = await apiHeaders(request);
  const listed = await (await request.fetch(`${api}/sessions`, { headers })).json();
  if (!Array.isArray(listed)) return;
  for (const session of listed) {
    if (!session?.id || typeof session.label !== 'string' || !labels.has(session.label)) continue;
    await request.fetch(`${api}/sessions/${session.id}/close`, { method: 'POST', headers, data: {} });
  }
}

test.afterEach(async ({ request }) => {
  await closeTrackedSessions(request, closeAfterTest);
  closeAfterTest.clear();
});

test.afterAll(async () => {
  if (heldSessionLabels.size === 0) return;
  const request = await apiContext.newContext();
  try {
    await closeTrackedSessions(request, heldSessionLabels);
  } finally {
    heldSessionLabels.clear();
    await request.dispose();
  }
});

/** Close the seed's service and remove its carta items, so the shared tenant is left as found. */
async function cleanupSeed(request: Parameters<typeof adminLogin>[0], seed: Carta & { sessionId?: string }) {
  const headers = await apiHeaders(request);
  if (seed.sessionId) await request.fetch(`${api}/sessions/${seed.sessionId}/close`, { method: 'POST', headers, data: {} });
  await request.fetch(`${api}/menu/${seed.platoId}`, { method: 'DELETE', headers });
  await request.fetch(`${api}/menu/${seed.bebidaId}`, { method: 'DELETE', headers });
}

/** Log in as the docente (admin) on the Altius host and open the admin comandero page. */
async function openAdmin(page: Page) {
  await loginAsBrowserOnHost(page, ALTIUS_ORIGIN, ADMIN.email, ADMIN.password);
  await page.goto(`${ALTIUS_ORIGIN}/es/admin/comandero`, { waitUntil: 'load' });
  await page.getByTestId('comandero-admin').waitFor({ timeout: 15000 });
}

/** Docente stepper: Carta is the default; Abrir servicio holds the start-session form. */
async function goAdminAbrir(page: Page) {
  await page.getByTestId('comandero-step-abrir').click();
  await page.getByTestId('comandero-session-label').waitFor({ timeout: 15000 });
}

/**
 * Open the student portal (general/alumno) on the Altius host, join a service BY NAME (the student
 * never types or sees an id), and switch to a role.
 */
async function openPortal(page: Page, sessionLabel: string, tab: 'camarero' | 'cocina' | 'barra') {
  await loginAsBrowserOnHost(page, ALTIUS_ORIGIN, STUDENT.email, STUDENT.password);
  await page.goto(`${ALTIUS_ORIGIN}/es/portal/comandero`, { waitUntil: 'load' });
  await page.getByTestId('comandero-portal').waitFor({ timeout: 15000 });
  await page.getByTestId('comandero-portal-session-option').filter({ hasText: rx(sessionLabel) }).click();
  await page.getByTestId(`comandero-tab-${tab}`).click();
}

/** Escape a string for use inside a RegExp. */
function rx(s: string): RegExp {
  return new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

/** Find a carta row by name, walking menu pagination (10 per page) if needed. */
async function expectMenuRow(page: Page, itemName: string, station?: RegExp | string) {
  const row = () => page.getByTestId('comandero-menu-row').filter({ hasText: itemName });
  // New items land on the last page; wait there first before walking from the start.
  try {
    await expect(row()).toHaveCount(1, { timeout: 5000 });
    if (station) await expect(row()).toContainText(station);
    return;
  } catch {
    /* walk pages below */
  }
  const prev = page.getByTestId('comandero-menu-prev');
  for (let guard = 0; guard < 20 && (await prev.count()) > 0 && !(await prev.isDisabled()); guard++) {
    try {
      await prev.click({ timeout: 2000 });
    } catch {
      break;
    }
  }
  for (let guard = 0; guard < 20; guard++) {
    if ((await row().count()) > 0) {
      await expect(row()).toHaveCount(1);
      if (station) await expect(row()).toContainText(station);
      return;
    }
    const next = page.getByTestId('comandero-menu-next');
    if ((await next.count()) === 0) break;
    if (await next.isDisabled()) break;
    try {
      await next.click({ timeout: 2000 });
    } catch {
      break;
    }
  }
  await expect(row(), `menu row "${itemName}" not found across pages`).toHaveCount(1, { timeout: 15000 });
}

/**
 * Waiter: open the order on the first table and add one snapshot item with a note.
 * The Select option text is "<name> · <station> · <price>", so match by the unique
 * name as a substring (not exact) — the per-test tag keeps it unambiguous.
 */
async function dismissWaiterSheet(page: Page) {
  if ((await page.getByTestId('comandero-waiter-sheet').count()) === 0) return;
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('comandero-waiter-sheet')).toHaveCount(0, { timeout: 10000 });
}

async function openWaiterSheet(page: Page) {
  await page.getByTestId('comandero-waiter-table').first().waitFor({ timeout: 15000 });
  if ((await page.getByTestId('comandero-waiter-sheet').count()) > 0) return;
  const openBtn = page.getByTestId('comandero-open-order').first();
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
  } else {
    await page.getByTestId('comandero-waiter-open-sheet').first().click();
  }
  await page.getByTestId('comandero-waiter-sheet').waitFor({ timeout: 15000 });
}

async function waiterAddLine(page: Page, itemName: string, note: string) {
  await openWaiterSheet(page);
  if (note) await page.getByTestId('comandero-line-note').fill(note);
  const tile = () => page.getByTestId('comandero-menu-tile').filter({ hasText: itemName });
  if ((await tile().count()) === 0) {
    await page.getByRole('tab', { name: /bebidas|drinks|begudes/i }).click();
  }
  if ((await tile().count()) === 0) {
    await page.getByRole('tab', { name: /platos|dishes|plats/i }).click();
  }
  await tile().click();
}

// ---------------------------------------------------------------------------

test.describe('KL-US-037 carta del aula + snapshot inmutable', () => {
  test.describe.configure({ timeout: 120000 });
  const tag = `s37-${Date.now()}`;

  test('docente crea carta por UI; plato va a cocina, bebida a barra', async ({ page }) => {
    await openAdmin(page);

    const tortilla = `Tortilla ${tag}`;
    const agua = `Agua ${tag}`;

    // The dev carta is shared per tenant, so assert this test's own rows by name
    // (not a global count). Each row is <name | station | price | delete>.
    await page.getByTestId('comandero-item-name').fill(tortilla);
    await page.getByTestId('comandero-item-price').fill('6');
    await page.getByTestId('comandero-item-add').click();
    await expectMenuRow(page, tortilla, 'Cocina');

    await page.getByTestId('comandero-item-name').fill(agua);
    await page.getByTestId('comandero-item-price').fill('1.5');
    // Select "bebida" so it routes to Barra (default is plato → Cocina).
    await page.getByTestId('comandero-item-category').click();
    await page.getByRole('option', { name: 'Bebida (barra)' }).click();
    await page.getByTestId('comandero-item-add').click();
    await expectMenuRow(page, agua, 'Barra');
  });

  // Snapshot immutability after carta delete → comanderoApi "keeps the session snapshot…"
});

test.describe('KL-US-038 mesas y apertura de comanda', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const tag = `s38-${Date.now()}`;

  test('camarero abre comanda en mesa libre; la 2a abierta se bloquea', async ({ page, request }) => {
    const { sessionLabel } = await seedSession(request, tag, true);
    await openPortal(page, sessionLabel, 'camarero');
    await page.getByTestId('comandero-waiter-table').first().waitFor({ timeout: 15000 });

    await page.getByTestId('comandero-open-order').first().click();
    // Once open, the mesa sheet shows the carta tiles and "+ Abrir" is gone for that table.
    await expect(page.getByTestId('comandero-waiter-sheet')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('comandero-item-select')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('comandero-open-order')).toHaveCount(0);
  });
});

test.describe('KL-US-039 anadir items y ruteo cocina/barra', () => {
  test.describe.configure({ timeout: 120000 });
  const tag = `s39-${Date.now()}`;

  test('anadir plato (cocina) y bebida (barra); llegan a cada cola', async ({ page, request }) => {
    const seed = await seedSession(request, tag);
    const { platoName, bebidaName } = seed;

    await openPortal(page, seed.sessionLabel, 'camarero');
    await waiterAddLine(page, platoName, 'sin gluten');
    await expect(page.getByText('sin gluten')).toBeVisible({ timeout: 15000 });

    await waiterAddLine(page, bebidaName, '');
    await dismissWaiterSheet(page);

    // Queues are per-session: kitchen shows the dish by name, bar shows the drink by name.
    await page.getByTestId('comandero-tab-cocina').click();
    await expect(page.getByTestId('comandero-station-cocina').getByText(platoName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('comandero-station-cocina').getByText(bebidaName)).toHaveCount(0);
    await page.getByTestId('comandero-tab-barra').click();
    await expect(page.getByTestId('comandero-station-barra').getByText(bebidaName)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('KL-US-040 colas de estacion y transiciones', () => {
  test.describe.configure({ timeout: 120000 });
  const tag = `s40-${Date.now()}`;

  test('cola de cocina excluye barra y avanza pedido -> en preparacion -> listo', async ({ page, request }) => {
    const seed = await seedSession(request, tag);

    // Add the dish line through the waiter UI so the whole flow is browser-driven.
    await openPortal(page, seed.sessionLabel, 'camarero');
    await waiterAddLine(page, seed.platoName, '');
    await dismissWaiterSheet(page);

    // Bar queue is empty (the only line is a dish).
    await page.getByTestId('comandero-tab-barra').click();
    await expect(page.getByTestId('comandero-station-barra').getByText(/no hay comandas pendientes/i)).toBeVisible({ timeout: 15000 });

    // Kitchen queue has exactly this session's dish; advance pedido -> en preparación -> listo.
    await page.getByTestId('comandero-tab-cocina').click();
    const cocina = page.getByTestId('comandero-station-cocina');
    await expect(cocina.getByText(rx(seed.platoName))).toBeVisible({ timeout: 15000 });
    await cocina.getByTestId('comandero-advance-line').first().click();
    await expect(cocina.getByText(/En preparaci/i)).toBeVisible({ timeout: 15000 });
    await cocina.getByTestId('comandero-advance-line').first().click();
    // Once 'listo' it leaves the station queue.
    await expect(cocina.getByText(rx(seed.platoName))).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe('KL-US-041 servir y cerrar cuenta', () => {
  test.describe.configure({ timeout: 120000 });
  const tag = `s41-${Date.now()}`;

  test('servir el listo y cerrar cuenta (subtotal, sin pago real)', async ({ page, request }) => {
    const seed = await seedSession(request, tag);
    await openPortal(page, seed.sessionLabel, 'camarero');
    await waiterAddLine(page, seed.platoName, '');
    await dismissWaiterSheet(page);

    // Advance in the kitchen to 'listo'.
    await page.getByTestId('comandero-tab-cocina').click();
    const cocina = page.getByTestId('comandero-station-cocina');
    await cocina.getByTestId('comandero-advance-line').first().click();
    await cocina.getByTestId('comandero-advance-line').first().click();

    // Serve + close from the waiter sheet.
    await page.getByTestId('comandero-tab-camarero').click();
    await openWaiterSheet(page);
    await page.getByTestId('comandero-serve-line').first().click();
    await page.getByTestId('comandero-close-bill').first().click();
    // Table shows "Libre" once the order is closed.
    await expect(page.getByText('Libre').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('KL-US-042 nota de linea visible en estacion', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const tag = `s42-${Date.now()}`;

  test('la nota del camarero viaja a la cola de cocina', async ({ page, request }) => {
    const seed = await seedSession(request, tag);
    await openPortal(page, seed.sessionLabel, 'camarero');
    await waiterAddLine(page, seed.platoName, 'sin sal');
    await dismissWaiterSheet(page);

    await page.getByTestId('comandero-tab-cocina').click();
    await expect(page.getByTestId('comandero-station-cocina').getByText('sin sal')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('KL-US-043 vista de sala del docente por polling + resumen', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const tag = `s43-${Date.now()}`;
  let sessionLabel = '';

  test('docente ve la mesa en la sala y cierra con resumen', async ({ page }) => {
    sessionLabel = `Sala ${tag}`;
    trackSessionLabel(sessionLabel);
    await openAdmin(page);

    // Need a carta item so the session is usable, then start + add a table.
    await page.getByTestId('comandero-item-name').fill(`Plato ${tag}`);
    await page.getByTestId('comandero-item-price').fill('5');
    await page.getByTestId('comandero-item-add').click();
    await page.getByTestId('comandero-menu-row').first().waitFor({ timeout: 15000 });

    await goAdminAbrir(page);
    await page.getByTestId('comandero-session-label').fill(sessionLabel);
    await page.getByTestId('comandero-session-start').click();
    await page.getByTestId('comandero-table-label').waitFor({ timeout: 15000 });
    await page.getByTestId('comandero-table-label').fill('Mesa 1');
    await page.getByTestId('comandero-table-add').click();

    // Floor (polling) shows the table.
    await expect(page.getByTestId('comandero-floor-table').first()).toBeVisible({ timeout: 15000 });

    // Close the session -> summary block appears.
    await page.getByTestId('comandero-session-close').click();
    await expect(page.getByTestId('comandero-session-summary')).toBeVisible({ timeout: 15000 });
  });
});

// Practice record + same-tenant queue isolation → comanderoApi.spec.ts
// Non-Altius Host 403 → comanderoApi "blocks comandero on a non-Altius Host…"

test.describe('KL-E-022 el comandero es exclusivo de Altius', () => {
  test.describe.configure({ timeout: 120000 });
  const HE_ORIGIN = `${base.protocol}//homelessentrepreneur.localhost:${base.port || '80'}`;

  test('en el host de otro tenant el login Altius es rechazado', async ({ page }) => {
    const loginRes = await page.request.post(`${HE_ORIGIN}/api/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    expect(loginRes.status(), 'Altius admin must not log in on HE host').toBe(401);
  });

  test('en el host de Altius el comandero si responde', async ({ page }) => {
    await loginAsBrowserOnHost(page, ALTIUS_ORIGIN, ADMIN.email, ADMIN.password);
    const res = await page.request.get(`${ALTIUS_ORIGIN}/api/comandero/menu`);
    expect(res.ok(), 'comandero API must be available on the Altius host').toBeTruthy();
  });
});

test.describe('Comandero edge cases (browser)', () => {
  test.describe.configure({ timeout: 120000 });

  test('el alumno entra por nombre, nunca ve el identificador, y se le avisa si el docente cierra el servicio', async ({ page, request }) => {
    const seed = await seedSession(request, `edge-${Date.now()}`);
    await openPortal(page, seed.sessionLabel, 'camarero');

    // The student sees the service name, never its id.
    await expect(page.getByTestId('comandero-portal-current')).toHaveText(rx(seed.sessionLabel));
    await expect(page.locator('body')).not.toContainText(seed.sessionId);

    // The teacher closes the service while the student is inside (cleans up the session too).
    const headers = await apiHeaders(request);
    const closed = await request.fetch(`${api}/sessions/${seed.sessionId}/close`, { method: 'POST', headers, data: {} });
    expect(closed.ok()).toBeTruthy();

    // The next poll tells the student, instead of leaving a dead screen.
    await expect(page.getByTestId('comandero-portal-closed')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Comandero' })).toBeVisible();
    await expect(page.getByTestId('comandero-open-order')).toHaveCount(0);
  });
});

// Exception HTTP paths (409/403/reclose) → comanderoApi.spec.ts / comanderoRolesApi.spec.ts

// ---------------------------------------------------------------------------
// Redesign: real running totals, joining a service by name, student permissions.
// Every test creates its own data (unique tag) and removes it in `finally`, so the
// shared Altius carta and the list of open services are left as found.
// ---------------------------------------------------------------------------

/** Money as the es locale prints it ("8,50 €", with a no-break space before the euro sign). */
const money = (euros: string) => new RegExp(`${euros.replace('.', '[.,]')}\\s*€`);

test.describe('Comandero redesign: primary course', () => {
  test.describe.configure({ timeout: 120000 });

  test('el camarero ve el total real de la mesa a medida que anade lineas (no 0,00)', async ({ page, request }) => {
    const seed = await seedSession(request, `tot-${Date.now()}`);
    try {
      await openPortal(page, seed.sessionLabel, 'camarero');
      const table = page.getByTestId('comandero-waiter-table').first();

      await waiterAddLine(page, seed.platoName, '');
      await expect(table).toContainText(money('6,00'), { timeout: 15000 });

      await waiterAddLine(page, seed.bebidaName, '');
      await expect(table).toContainText(money('8,50'), { timeout: 15000 });
      await expect(table).not.toContainText(money('0,00'));
    } finally {
      await cleanupSeed(request, seed);
    }
  });

  test('el docente ve el total real de la mesa en la sala en vivo y cierra con resumen', async ({ page, request }) => {
    const tag = `flr-${Date.now()}`;
    const carta = await seedCarta(request, tag);
    const label = `Sala ${tag}`;
    trackSessionLabel(label);
    let sessionId = '';
    try {
      await openAdmin(page);
      await goAdminAbrir(page);
      await page.getByTestId('comandero-session-label').fill(label);
      await page.getByTestId('comandero-session-start').click();
      await page.getByTestId('comandero-table-label').waitFor({ timeout: 15000 });
      await page.getByTestId('comandero-table-label').fill('Mesa 1');
      await page.getByTestId('comandero-table-add').click();
      await expect(page.getByTestId('comandero-floor-table').first()).toBeVisible({ timeout: 15000 });

      // A student takes an order on that table (set up through the API; the teacher only watches).
      const headers = await apiHeaders(request);
      const open = await (await request.fetch(`${api}/sessions`, { headers })).json();
      sessionId = open.find((s: { label: string }) => s.label === label).id;
      const floor = await (await request.fetch(`${api}/sessions/${sessionId}/floor`, { headers })).json();
      const snapshot = await (await request.fetch(`${api}/sessions/${sessionId}/snapshot`, { headers })).json();
      const order = await (
        await request.fetch(`${api}/tables/${floor.tables[0].table.id}/order`, { method: 'POST', headers, data: {} })
      ).json();
      for (const name of [carta.platoName, carta.bebidaName]) {
        const item = snapshot.find((s: { name: string }) => s.name === name);
        await request.fetch(`${api}/orders/${order.id}/lines`, { method: 'POST', headers, data: { snapshot_item_id: item.id } });
      }

      // The floor polls: the table shows its real total and a line per item.
      const tableCard = page.getByTestId('comandero-floor-table').first();
      await expect(tableCard).toContainText(money('8,50'), { timeout: 20000 });
      await expect(tableCard).toContainText(carta.platoName);
      await expect(tableCard).toContainText(carta.bebidaName);

      await page.getByTestId('comandero-session-close').click();
      await expect(page.getByTestId('comandero-session-summary')).toBeVisible({ timeout: 15000 });
    } finally {
      await cleanupSeed(request, { ...carta, sessionId });
    }
  });
});

test.describe('Comandero redesign: exception course', () => {
  test.describe.configure({ timeout: 120000 });

  test('el alumno no ve los controles del docente: ni carta, ni arrancar o cerrar servicio, ni anadir mesas', async ({ page, request }) => {
    const seed = await seedSession(request, `rol-${Date.now()}`);
    try {
      await openPortal(page, seed.sessionLabel, 'camarero');
      await expect(page.getByTestId('comandero-waiter-table').first()).toBeVisible({ timeout: 15000 });

      for (const teacherControl of [
        'comandero-item-add',
        'comandero-item-name',
        'comandero-session-start',
        'comandero-session-close',
        'comandero-table-add',
      ]) {
        await expect(page.getByTestId(teacherControl), teacherControl).toHaveCount(0);
      }
    } finally {
      await cleanupSeed(request, seed);
    }
  });

  test('un servicio cerrado deja de ofrecerse al alumno, y uno abierto sigue ahi', async ({ page, request }) => {
    const tag = `cls-${Date.now()}`;
    const open = await seedSession(request, `${tag}-a`);
    const closed = await seedSession(request, `${tag}-b`);
    try {
      const headers = await apiHeaders(request);
      await request.fetch(`${api}/sessions/${closed.sessionId}/close`, { method: 'POST', headers, data: {} });

      await loginAsBrowserOnHost(page, ALTIUS_ORIGIN, STUDENT.email, STUDENT.password);
      await page.goto(`${ALTIUS_ORIGIN}/es/portal/comandero`, { waitUntil: 'load' });
      const option = (label: string) =>
        page.getByTestId('comandero-portal-session-option').filter({ hasText: rx(label) });

      // The open service is listed (so the list has loaded) and the closed one is not.
      await expect(option(open.sessionLabel)).toHaveCount(1, { timeout: 15000 });
      await expect(option(closed.sessionLabel)).toHaveCount(0);
    } finally {
      await cleanupSeed(request, open);
      await cleanupSeed(request, closed);
    }
  });

  test('cerrar la cuenta con lineas sin servir muestra el motivo y la mesa conserva su total', async ({ page, request }) => {
    const seed = await seedSession(request, `cta-${Date.now()}`);
    try {
      await openPortal(page, seed.sessionLabel, 'camarero');
      await waiterAddLine(page, seed.platoName, '');
      const table = page.getByTestId('comandero-waiter-table').first();
      await expect(table).toContainText(money('6,00'), { timeout: 15000 });

      // Nothing is ready: no "Servir", and close stays disabled with the "falta servir" reason.
      await expect(page.getByTestId('comandero-serve-line')).toHaveCount(0);
      const closeBill = page.getByTestId('comandero-close-bill').first();
      await expect(closeBill).toBeDisabled();
      await expect(closeBill).toContainText(/falta servir|still to serve/i);
      await expect(table).toContainText(money('6,00'));
      await dismissWaiterSheet(page);
      await expect(table).not.toContainText('Libre');
    } finally {
      await cleanupSeed(request, seed);
    }
  });
});
