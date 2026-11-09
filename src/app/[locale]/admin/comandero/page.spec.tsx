import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '@/app/test-utils';
import ComanderoAdminPage from './page';

const croquetas = { id: 'm1', name: 'Croquetas', category: 'plato', price_cents: 600 };
const cana = { id: 'm2', name: 'Caña', category: 'bebida', price_cents: 250 };

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200) {
  // A real fetch always yields a fresh object; returning the live state would make React skip the re-render.
  const copy = () => JSON.parse(JSON.stringify(body));
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(copy()) });
}

const line = (id: string, name: string, status: string, note: string | null = null) => ({
  id,
  order_id: 'o1',
  name,
  status,
  note,
  station: 'cocina',
  price_cents: 0,
});

/** A tiny in-memory backend for the pages under test. */
function mockBackend() {
  const state = {
    menu: [croquetas, cana] as Array<Record<string, unknown>>,
    tables: [] as Array<Record<string, unknown>>,
    posts: [] as Array<{ url: string; body: unknown }>,
  };
  const floor = () => ({
    session_id: 's1',
    tables: state.tables.map((table, i) => ({
      table,
      // The first table has an open order with a real running total; the rest are free.
      open_order: i === 0 ? { id: 'o1', session_id: 's1', table_id: table.id, status: 'abierta', subtotal_cents: 850 } : null,
      lines: i === 0 ? [line('l1', 'Croquetas', 'listo', 'sin gluten'), line('l2', 'Caña', 'pedido')] : [],
    })),
  });

  type Route = { method: string; suffix: string; reply: (body: Record<string, unknown>) => ReturnType<typeof jsonResponse> };
  const routes: Route[] = [
    { method: 'GET', suffix: '/api/csrf-token', reply: () => jsonResponse({}) },
    { method: 'GET', suffix: '/api/comandero/menu', reply: () => jsonResponse(state.menu) },
    {
      method: 'POST',
      suffix: '/api/comandero/menu',
      reply: (body) => {
        const item = { id: `m${state.menu.length + 1}`, ...body };
        state.menu.push(item);
        return jsonResponse(item, 201);
      },
    },
    {
      method: 'POST',
      suffix: '/api/comandero/sessions',
      reply: (body) => jsonResponse({ id: 's1', label: body.label, status: 'activa' }, 201),
    },
    {
      method: 'POST',
      suffix: '/sessions/s1/tables',
      reply: (body) => {
        const table = { id: `t${state.tables.length + 1}`, session_id: 's1', label: body.label };
        state.tables.push(table);
        return jsonResponse(table, 201);
      },
    },
    { method: 'GET', suffix: '/sessions/s1/floor', reply: () => jsonResponse(floor()) },
    {
      method: 'POST',
      suffix: '/sessions/s1/close',
      reply: () =>
        jsonResponse({
          session_id: 's1',
          avg_phase_ms: { pedido: 1500, en_preparacion: 2500, listo: 500 },
          waiting_lines: 1,
          service_order: [{ line_id: 'l1', name: 'Croquetas', served_at: null }],
        }),
    },
  ];

  global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (method === 'POST') state.posts.push({ url, body });
    const route = routes.find((r) => r.method === method && url.endsWith(r.suffix));
    return route ? route.reply(body) : jsonResponse({}, 404);
  }) as unknown as typeof fetch;

  return state;
}

const renderPage = () =>
  render(
    <TestProviders>
      <ComanderoAdminPage />
    </TestProviders>,
  );

/** Intl uses a no-break space before the euro sign; compare with a normal space. */
const plain = (s: string | null) => (s ?? '').replace(/\u00a0/g, ' ');

describe('Comandero admin: carta', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists the carta with localized prices and the station of each item', async () => {
    mockBackend();
    renderPage();

    const rows = await screen.findAllByTestId('comandero-menu-row');
    expect(rows).toHaveLength(2);
    expect(plain(within(rows[0]).getByTestId('comandero-menu-row-price').textContent)).toBe('6,00 €');
    expect(within(rows[0]).getByText('Cocina')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Barra')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar Croquetas' })).toBeInTheDocument();
  });

  it('adds a dish with the price in cents and clears the form', async () => {
    const backend = mockBackend();
    renderPage();
    await screen.findAllByTestId('comandero-menu-row');

    await userEvent.type(screen.getByTestId('comandero-item-name'), 'Tortilla');
    await userEvent.type(screen.getByTestId('comandero-item-price'), '4.5');
    await userEvent.click(screen.getByTestId('comandero-item-add'));

    await waitFor(() => expect(screen.getAllByTestId('comandero-menu-row')).toHaveLength(3));
    const created = backend.posts.find((p) => p.url.endsWith('/api/comandero/menu'));
    expect(created?.body).toEqual({ name: 'Tortilla', category: 'plato', price_cents: 450 });
    expect(screen.getByTestId('comandero-item-name')).toHaveValue('');
  });
});

describe('Comandero admin: practice session', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('only starts a service that has a name', async () => {
    mockBackend();
    renderPage();

    const start = await screen.findByTestId('comandero-session-start');
    expect(start).toBeDisabled();
    await userEvent.type(screen.getByTestId('comandero-session-label'), '   ');
    expect(start).toBeDisabled();
    await userEvent.type(screen.getByTestId('comandero-session-label'), 'Servicio mediodía');
    expect(start).toBeEnabled();
  });

  it('shows the live floor with the real total and free tables, then the summary on close', async () => {
    mockBackend();
    renderPage();

    await userEvent.type(await screen.findByTestId('comandero-session-label'), 'Servicio mediodía');
    await userEvent.click(screen.getByTestId('comandero-session-start'));

    await userEvent.type(await screen.findByTestId('comandero-table-label'), 'Mesa 1');
    await userEvent.click(screen.getByTestId('comandero-table-add'));
    await userEvent.type(screen.getByTestId('comandero-table-label'), 'Mesa 2');
    await userEvent.click(screen.getByTestId('comandero-table-add'));

    const tables = await waitFor(() => {
      const found = screen.getAllByTestId('comandero-floor-table');
      expect(found).toHaveLength(2);
      return found;
    });
    expect(plain(tables[0].textContent)).toContain('8,50 €');
    expect(within(tables[0]).getByText('Listo')).toBeInTheDocument();
    expect(within(tables[0]).getByText(/sin gluten/)).toBeInTheDocument();
    expect(within(tables[1]).getByText('Libre')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('comandero-session-close'));

    const summary = await screen.findByTestId('comandero-session-summary');
    expect(summary).toHaveTextContent('Líneas en espera al cerrar: 1');
    expect(summary).toHaveTextContent('Ítems servidos: 1');
    expect(summary).toHaveTextContent('pedido 1.5 · preparación 2.5 · listo 0.5');
    expect(screen.getByTestId('comandero-session-start')).toBeInTheDocument();
  });
});
