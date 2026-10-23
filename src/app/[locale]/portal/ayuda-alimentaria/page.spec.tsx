import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodAidPortalPage from './page';
import { TestProviders } from '@/app/test-utils';

const ITEM_ID = '22222222-2222-2222-2222-222222222222';
const LOT_ID = '33333333-3333-3333-3333-333333333333';

const item = {
  id: ITEM_ID,
  tenant_id: 'tenant-1',
  title: 'Latas de tomate',
  description: 'Lote semanal',
  category: 'food',
  unit: 'kg',
  ean: null,
  pictures: [],
  cover: null,
  created_at: '2026-10-20T10:00:00.000Z',
  updated_at: '2026-10-20T10:00:00.000Z',
};

const lot = {
  id: LOT_ID,
  tenant_id: 'tenant-1',
  item_id: ITEM_ID,
  quantity: 40,
  expiry_date: '2027-01-01T00:00:00.000Z',
  location: 'Almacén A',
  received_at: '2026-10-20T10:00:00.000Z',
  status: 'accepted',
  created_at: '2026-10-20T10:00:00.000Z',
  updated_at: '2026-10-20T10:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

type Call = { url: string; method: string; body: unknown };

/**
 * Routes the food-aid endpoints the page is expected to call. Anything else
 * answers 404, exactly as the backend does today.
 */
jest.mock('@/app/auth/useAuthGate', () => ({
  useAuthGate: () => ({
    user: { role: 'admin', name: 'Admin', email: 'admin@test.com' },
    isAuthenticated: true,
    isLoading: false,
    status: 'authenticated',
    logout: jest.fn(),
  }),
}));

function foodAidRouter(calls: Call[] = []) {
  const routes: Record<string, { status: number; body: unknown }> = {
    'GET /api/food-aid/items': { status: 200, body: [item] },
    'GET /api/food-aid/lots': { status: 200, body: [lot] },
    'GET /api/food-aid/lots/expiring': { status: 200, body: [] },
    'POST /api/food-aid/items': { status: 201, body: item },
    'POST /api/food-aid/lots': { status: 201, body: lot },
    'PATCH /api/food-aid/lots/33333333-3333-3333-3333-333333333333': {
      status: 200,
      body: { ...lot, status: 'partial' },
    },
  };

  return (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method !== 'GET') {
      calls.push({
        url,
        method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
    }
    const key = `${method} ${url.replace(/^.*(?=\/api\/food-aid)/, '')}`;
    const route = routes[key];
    if (!route) return jsonResponse({ error: 'not found' }, 404);
    return jsonResponse(route.body, route.status);
  };
}

describe('Food aid portal page', () => {
  let fetchMock: jest.Mock;

  beforeAll(() => {
    // jsdom does not implement pointer capture; Radix Select needs it to open.
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = () => undefined;
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => undefined;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists the tenant lots joined with their item and their status', async () => {
    fetchMock.mockImplementation(foodAidRouter());

    render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    expect(await screen.findByText('Latas de tomate')).toBeInTheDocument();
    expect(screen.getByText('Almacén A')).toBeInTheDocument();
    expect(screen.getByText('Aceptado')).toBeInTheDocument();
  });

  it('shows a non-broken empty state when the tenant has no records', async () => {
    fetchMock.mockImplementation(() => jsonResponse([]));

    render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    expect(
      await screen.findByText('Todavía no hay solicitudes de ayuda alimentaria')
    ).toBeInTheDocument();
    // The label appears both in the header action and in the empty state action.
    expect(screen.getAllByText('Nueva solicitud').length).toBeGreaterThan(0);
  });

  it('surfaces a readable error when the food-aid service is unavailable', async () => {
    fetchMock.mockImplementation(() => jsonResponse({ error: 'boom' }, 500));

    render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    expect(
      await screen.findByText(
        'El servicio de ayuda alimentaria no está disponible ahora mismo. Vuelve a intentarlo en unos minutos.'
      )
    ).toBeInTheDocument();
  });

  it('posts the item and the lot to the real food-aid endpoints', async () => {
    const calls: Call[] = [];
    fetchMock.mockImplementation(foodAidRouter(calls));

    const user = userEvent.setup();
    render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    await screen.findByText('Latas de tomate');

    await user.click(screen.getByRole('button', { name: /Nueva solicitud/ }));

    const titleInput = screen.getByLabelText('Título');
    await user.clear(titleInput);
    await user.type(titleInput, 'Latas de alubias');

    const quantityInput = screen.getByLabelText('Cantidad');
    await user.clear(quantityInput);
    await user.type(quantityInput, '12');

    const locationInput = screen.getByLabelText('Ubicación de almacenaje');
    await user.clear(locationInput);
    await user.type(locationInput, 'Almacén B');

    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));

    await waitFor(() => {
      expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/api/food-aid/items'))).toBe(true);
      expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/api/food-aid/lots'))).toBe(true);
    });

    const itemCall = calls.find((c) => c.method === 'POST' && c.url.endsWith('/api/food-aid/items'));
    const lotCall = calls.find((c) => c.method === 'POST' && c.url.endsWith('/api/food-aid/lots'));

    expect(itemCall?.body).toMatchObject({
      title: 'Latas de alubias',
      category: 'food',
      unit: 'kg',
      ean: null,
      description: null,
    });
    expect(lotCall?.body).toMatchObject({
      item_id: ITEM_ID,
      quantity: 12,
      location: 'Almacén B',
      status: 'accepted',
    });
    // No tenant id may ever be sent from the browser.
    expect(JSON.stringify(itemCall?.body)).not.toContain('tenant_id');
    expect(JSON.stringify(lotCall?.body)).not.toContain('tenant_id');
  });

  it('shows the translated message when the food-aid route does not exist yet', async () => {
    // The backend has no food-aid router today, so the proxy answers 404.
    fetchMock.mockImplementation(() => jsonResponse({ error: 'not found' }, 404));

    render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    expect(
      await screen.findByText(
        'El servicio de ayuda alimentaria no está disponible ahora mismo. Vuelve a intentarlo en unos minutos.'
      )
    ).toBeInTheDocument();
  });

  it('updates the triage status through the lot status endpoint', async () => {
    const calls: Call[] = [];
    fetchMock.mockImplementation(foodAidRouter(calls));

    const user = userEvent.setup();
    render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    await screen.findByText('Latas de tomate');

    await user.click(
      screen.getByRole('combobox', { name: 'Cambiar el estado de Latas de tomate' })
    );
    await user.click(screen.getByRole('option', { name: 'Parcial' }));

    await waitFor(() => {
      expect(
        calls.some(
          (c) =>
            c.method === 'PATCH' &&
            c.url.endsWith(`/api/food-aid/lots/${LOT_ID}`)
        )
      ).toBe(true);
    });

    const patchCall = calls.find((c) => c.method === 'PATCH');
    expect(patchCall?.body).toEqual({ status: 'partial' });
    expect(JSON.stringify(patchCall?.body)).not.toContain('tenant_id');
  });

  it('renders no unresolved translation keys anywhere in the page', async () => {
    fetchMock.mockImplementation(foodAidRouter());

    const user = userEvent.setup();
    const { container } = render(
      <TestProviders>
        <FoodAidPortalPage />
      </TestProviders>
    );

    await screen.findByText('Latas de tomate');

    // Open the form so its own labels and option texts are rendered too.
    await user.click(screen.getByRole('button', { name: /Nueva solicitud/ }));

    // Open each dropdown in turn so every option label is rendered.
    await user.click(screen.getByRole('combobox', { name: 'Categoría' }));
    expect(screen.getByRole('option', { name: 'Alimentación' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('combobox', { name: 'Estado de triaje' }));
    expect(screen.getByRole('option', { name: 'Aceptado' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    // next-intl renders a missing key as its own dotted path.
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/portal\.foodAid\.[\w.]+/);
  });
});
