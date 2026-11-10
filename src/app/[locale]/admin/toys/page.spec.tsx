import { render, screen, waitFor } from '@testing-library/react';
import ToysOverviewPage from './page';
import { TestProviders } from '@/app/test-utils';

let mockEnabled = true;

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Staff' }, authToken: 'token123' }, status: 'authenticated' }),
}));

jest.mock('@/app/auth/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

function setup(lists: Record<string, unknown>) {
  global.fetch = jest.fn((url: string) => {
    const u = String(url);
    if (u.endsWith('/status')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ enabled: mockEnabled }) } as Response);
    const key = Object.keys(lists).find((k) => u.endsWith(k));
    if (!key) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: 'nope' }) } as Response);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(lists[key]) } as Response);
  }) as jest.Mock;
  render(
    <TestProviders>
      <ToysOverviewPage />
    </TestProviders>,
  );
}

describe('ToysOverviewPage', () => {
  beforeEach(() => {
    mockEnabled = true;
  });
  afterEach(() => jest.resetAllMocks());

  it('starts in Preparar and points to the inventory when there are no toys', async () => {
    setup({ '/items': [], '/children': [], '/slots': [], '/bookings': [], '/pending': [], '/dispositions': [] });
    await waitFor(() => expect(screen.getByTestId('toys-phase-preparar')).toHaveAttribute('data-state', 'now'));
    expect(screen.getByTestId('toys-next-action')).toHaveAttribute('href', expect.stringContaining('/admin/toys/stock'));
    expect(screen.getByTestId('toys-age-empty')).toBeInTheDocument();
  });

  it('moves to Reservas with toys and children and compares them by age', async () => {
    setup({
      '/items': [{ id: 'a', quantity: 3, ageBand: 'y5_7' }, { id: 'b', quantity: 1, ageBand: 'y8_11' }],
      '/children': [{ id: 'c1', age: 6 }, { id: 'c2', age: 9 }, { id: 'c3', age: 10 }],
      '/slots': [],
      '/bookings': [],
      '/pending': [],
      '/dispositions': [],
    });
    await waitFor(() => expect(screen.getByTestId('toys-phase-reservas')).toHaveAttribute('data-state', 'now'));
    expect(screen.getByTestId('toys-phase-preparar')).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('toys-n-units')).toHaveTextContent('4');
    expect(screen.getByTestId('toys-n-children')).toHaveTextContent('3');
    expect(screen.getByTestId('toys-next')).toHaveTextContent('Añade los turnos de recogida');
    expect(screen.getByTestId('toys-age-y5_7')).toHaveTextContent('Sobran 2');
    expect(screen.getByTestId('toys-age-y8_11')).toHaveTextContent('Faltan 1');
  });

  it('shows a dash when a list cannot be read', async () => {
    setup({ '/items': [], '/slots': [], '/bookings': [], '/pending': [], '/dispositions': [] });
    await waitFor(() => expect(screen.getByTestId('toys-n-children')).toHaveTextContent('—'));
  });

  it('keeps every old tool reachable from the overview', async () => {
    setup({ '/items': [], '/children': [], '/slots': [], '/bookings': [], '/pending': [], '/dispositions': [] });
    await waitFor(() => expect(screen.getByTestId('toys-tool-cierre')).toBeInTheDocument());
    expect(screen.getByTestId('toys-tool-entrega')).toHaveAttribute('href', expect.stringContaining('/admin/toys/entrega'));
  });

  it('shows the real delivered count once pickup days start', async () => {
    setup({
      '/items': [{ id: 'a', quantity: 3, ageBand: 'y5_7' }],
      '/children': [{ id: 'c1', age: 6 }],
      '/slots': [{ id: 's', date: '2020-12-14' }],
      '/bookings': [],
      '/pending': [{ id: 'p', status: 'checked_out' }],
      '/dispositions': [],
      '/handover/summary': { delivered: 7, to_collect: 1, open: 0, problems: 0 },
    });
    await waitFor(() => expect(screen.getByTestId('toys-phase-entrega')).toHaveAttribute('data-state', 'now'));
    expect(screen.getByTestId('toys-n-delivered')).toHaveTextContent('7');
    expect(screen.getByTestId('toys-n-tocollect')).toHaveTextContent('1');
    expect(screen.getByTestId('toys-next-action')).toHaveAttribute('href', expect.stringContaining('/admin/toys/entrega'));
  });

  it('denies the page when the flag is off', async () => {
    mockEnabled = false;
    setup({});
    await waitFor(() => expect(screen.getByTestId('toys-denied')).toBeInTheDocument());
  });
});
