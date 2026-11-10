import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '@/app/test-utils';
import { StationView } from './StationView';

const SESSION = '11111111-1111-1111-1111-111111111111';

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

const cocinaLine = {
  id: 'line-1',
  order_id: 'order-1',
  snapshot_item_id: 'snap-1',
  name: 'Croquetas',
  station: 'cocina',
  price_cents: 600,
  status: 'pedido',
  note: 'sin gluten',
  ordered_at: '2026-11-07T10:00:00.000Z',
  preparing_at: null,
  ready_at: null,
  served_at: null,
  table_id: 't1',
  table_label: 'Mesa 1',
};

const originalFetch = global.fetch;

describe('StationView (KL-S-050 cola de estación)', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders only its station queue and advances a line', async () => {
    const advanceCalls: string[] = [];
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/stations/cocina')) {
        return jsonResponse([cocinaLine]) as ReturnType<typeof fetch>;
      }
      if (url.includes('/lines/line-1/advance')) {
        advanceCalls.push(url);
        return jsonResponse({ ...cocinaLine, status: 'en_preparacion' }) as ReturnType<typeof fetch>;
      }
      return jsonResponse({}, 404) as ReturnType<typeof fetch>;
    }) as unknown as typeof fetch;

    render(
      <TestProviders>
        <StationView sessionId={SESSION} station="cocina" />
      </TestProviders>,
    );

    // The line and its note show up.
    expect(await screen.findByText('Croquetas')).toBeInTheDocument();
    expect(screen.getByText(/sin gluten/)).toBeInTheDocument();

    // Advancing calls the advance endpoint for this line.
    await userEvent.click(screen.getByRole('button', { name: /empezar a preparar/i }));
    await waitFor(() => expect(advanceCalls.length).toBeGreaterThan(0));
  });

  it('shows an empty queue message when the station has no pending lines', async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/stations/barra')) return jsonResponse([]) as ReturnType<typeof fetch>;
      return jsonResponse({}, 404) as ReturnType<typeof fetch>;
    }) as unknown as typeof fetch;

    render(
      <TestProviders>
        <StationView sessionId={SESSION} station="barra" />
      </TestProviders>,
    );

    expect(await screen.findByText(/no hay comandas pendientes/i)).toBeInTheDocument();
  });
});
