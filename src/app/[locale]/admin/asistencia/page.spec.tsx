import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AsistenciaPage from './page';
import { TestProviders } from '@/app/test-utils';

const stableSession = {
  data: { user: { name: 'Admin', email: 'admin@test.com' }, authToken: 'token123' },
  status: 'authenticated',
};

jest.mock('next-auth/react', () => ({
  useSession: () => stableSession,
}));

const TYPE_ID = '22222222-2222-2222-2222-222222222222';
const entry = {
  activityTypeId: TYPE_ID,
  name: 'Taller de lectura',
  category: 'educación',
  localidad: 'Madrid',
  date: '2030-06-10T09:00:00.000Z',
  shift: 'mañana',
  capacity: 10,
  bookedCount: 1,
  available: 9,
  waitlistCount: 0,
  isCancelled: false,
};

const attendanceRow = {
  id: 'b-1',
  user_id: 'u-1',
  activity_type_id: TYPE_ID,
  date: '2030-06-10T09:00:00.000Z',
  shift: 'mañana',
  status: 'confirmed',
  cancel_reason: null,
  checkIn: { id: 'c-1', check_in_at: '2030-06-10T09:05:00.000Z', check_out_at: null, duration_minutes: null },
};

function setupFetch(handlers: Array<(url: string, init?: RequestInit) => unknown | undefined>) {
  return jest.fn((url: string, init?: RequestInit) => {
    for (const h of handlers) {
      const body = h(String(url), init);
      if (body !== undefined) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
      }
    }
    return Promise.reject(new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`));
  }) as jest.Mock;
}

describe('admin asistencia page', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  });

  afterEach(() => { jest.resetAllMocks(); });

  it('lists calendar entries and shows attendance with statuses and check-in times', async () => {
    global.fetch = setupFetch([
      (url) => (url.includes('/api/activities/sessions') && !url.includes('ad-hoc') ? [entry] : undefined),
      (url) => (url.includes('/api/users') ? [{ user_id: 'u-1', display_name: 'Ana García' }] : undefined),
      (url) => (url.includes('/attendance') ? [attendanceRow] : undefined),
    ]) as jest.Mock;

    render(<TestProviders><AsistenciaPage /></TestProviders>);

    const entryButton = await screen.findByRole('button', { name: /Taller de lectura/ });
    await userEvent.click(entryButton);

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:05/)).toBeInTheDocument();
  });

  it('shows cancelled entries with a badge and offers walk-in form for free volunteers', async () => {
    global.fetch = setupFetch([
      (url) => (url.includes('/api/activities/sessions') && !url.includes('ad-hoc')
        ? [entry, { ...entry, activityTypeId: TYPE_ID + '-x', date: '2030-06-11T09:00:00.000Z', isCancelled: true }]
        : undefined),
      (url) => (url.includes('/api/users') ? [
        { user_id: 'u-1', display_name: 'Ana García' },
        { user_id: 'u-2', display_name: 'Beto López' },
      ] : undefined),
      (url) => (url.includes('/attendance') ? [] : undefined),
      (url, init) => (init?.method === 'POST' ? {} : undefined),
    ]) as jest.Mock;

    render(<TestProviders><AsistenciaPage /></TestProviders>);

    const cancelled = await screen.findByRole('button', { name: /Cancelada/ });
    await userEvent.click(cancelled);

    await waitFor(() => {
      expect(screen.getByText('No hay reservas para esta entrada')).toBeInTheDocument();
    });
    expect(screen.getByText('Añadir voluntario sin reserva (walk-in)')).toBeInTheDocument();
  });

  it('submits walk-in for a selected volunteer', async () => {
    const fetchMock = setupFetch([
      (url) => (url.includes('/api/activities/sessions') && !url.includes('ad-hoc') ? [entry] : undefined),
      (url) => (url.includes('/api/users') ? [{ user_id: 'u-2', display_name: 'Beto López' }] : undefined),
      (url) => (url.includes('/attendance') ? [] : undefined),
      (url, init) => (init?.method === 'POST' ? {} : undefined),
    ]);
    global.fetch = fetchMock as jest.Mock;

    render(<TestProviders><AsistenciaPage /></TestProviders>);

    await userEvent.click(await screen.findByRole('button', { name: /Taller de lectura/ }));
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());

    // open select and choose volunteer
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Beto López' }));

    const addButton = await screen.findByRole('button', { name: 'Añadir' });
    await waitFor(() => expect(addButton).toBeEnabled());
    await userEvent.click(addButton);

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST');
      expect(post).toBeDefined();
      expect(String(post?.[0])).toContain(`/entries/${TYPE_ID}/2030-06-10T09%3A00%3A00.000Z/ma%C3%B1ana/add-volunteer`);
      expect(JSON.parse(String((post as [string, RequestInit])[1].body))).toEqual({ volunteerId: 'u-2' });
    });
  });
});
