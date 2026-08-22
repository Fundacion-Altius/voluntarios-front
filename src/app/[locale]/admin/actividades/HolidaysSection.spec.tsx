import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HolidaysSection from './HolidaysSection';
import { TestProviders } from '@/app/test-utils';

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Admin', email: 'admin@test.com' }, authToken: 'token123' },
    status: 'authenticated',
  }),
}));

const holiday = (overrides: Record<string, unknown> = {}) => ({
  id: 'h-1',
  date: '2030-12-06T00:00:00.000Z',
  name: 'Festivo local',
  region: 'Madrid',
  source: 'manual',
  active: 'true',
  created_at: '2030-01-01T00:00:00.000Z',
  ...overrides,
});

function setupFetch(responses: Array<{ match: (url: string, init?: RequestInit) => boolean; body?: unknown; ok?: boolean }>) {
  const fetchMock = jest.fn((url: string, init?: RequestInit) => {
    const r = responses.find((x) => x.match(String(url), init));
    if (!r) return Promise.reject(new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`));
    return Promise.resolve({
      ok: r.ok ?? true,
      json: () => Promise.resolve(r.body ?? {}),
    } as Response);
  });
  global.fetch = fetchMock as jest.Mock;
  return fetchMock;
}

describe('HolidaysSection', () => {
  afterEach(() => { jest.resetAllMocks(); });

  it('renders auto and manual holidays with region badges', async () => {
    setupFetch([
      {
        match: (u) => u.includes('/api/activities/holidays'),
        body: [holiday(), holiday({ id: 'h-2', name: 'Navidad', source: 'auto', active: 'false' })],
      },
    ]);

    render(<TestProviders><HolidaysSection /></TestProviders>);

    expect(await screen.findByText('Festivo local')).toBeInTheDocument();
    expect(screen.getByText('Navidad')).toBeInTheDocument();
    const manual = screen.getAllByText('Manual');
    expect(manual).toHaveLength(1);
    expect(screen.getByText('Automático')).toBeInTheDocument();
  });

  it('adds a manual holiday via the form', async () => {
    const fetchMock = setupFetch([
      { match: (u, init) => u.includes('/api/activities/holidays') && (init?.method ?? 'GET') === 'GET', body: [] },
      { match: (u, init) => u.includes('/api/activities/holidays') && init?.method === 'POST', body: {} },
    ]);
    // after POST, refetch returns one row
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([holiday()]),
      } as Response);
    });

    render(<TestProviders><HolidaysSection /></TestProviders>);

    await screen.findByText('Añadir festivo manual');
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const nameInput = document.querySelector('form input:not([type="date"])') as HTMLInputElement;
    expect(dateInput).toBeTruthy();

    await userEvent.type(dateInput, '2030-12-06');
    await userEvent.type(nameInput, 'Festivo local');

    await userEvent.click(screen.getByRole('button', { name: /Añadir festivo/i }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST');
      expect(post).toBeDefined();
      expect(JSON.parse(String((post as [string, RequestInit])[1].body))).toEqual({
        date: '2030-12-06',
        name: 'Festivo local',
        region: 'general',
      });
    });
  });

  it('toggles a holiday inactive state and deletes it', async () => {
    const fetchMock = setupFetch([
      { match: () => true, body: [holiday()] },
    ]);

    render(<TestProviders><HolidaysSection /></TestProviders>);

    const deactivate = await screen.findByRole('button', { name: 'Desactivar' });
    await userEvent.click(deactivate);

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PUT');
      expect(put).toBeDefined();
      expect(String(put?.[0])).toContain('/api/activities/holidays/h-1/deactivate');
    });

    const remove = screen.getByRole('button', { name: 'Eliminar' });
    await userEvent.click(remove);

    await waitFor(() => {
      const del = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'DELETE');
      expect(del).toBeDefined();
      expect(String(del?.[0])).toContain('/api/activities/holidays/h-1');
    });
  });
});
