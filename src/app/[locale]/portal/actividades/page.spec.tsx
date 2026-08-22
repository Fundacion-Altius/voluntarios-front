import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActividadesPortalPage from './page';
import { TestProviders } from '@/app/test-utils';

const TYPE_ID = '11111111-1111-1111-1111-111111111111';

const calendarEntry = (overrides: Record<string, unknown> = {}) => ({
  activityTypeId: TYPE_ID,
  name: 'Taller de lectura',
  category: 'educación',
  localidad: 'Madrid',
  date: '2030-06-10T09:00:00.000Z',
  shift: 'mañana',
  capacity: 10,
  bookedCount: 3,
  available: 7,
  waitlistCount: 0,
  isCancelled: false,
  ...overrides,
});

const booking = (overrides: Record<string, unknown> = {}) => ({
  id: 'booking-1',
  activity_type_id: TYPE_ID,
  name: 'Taller de lectura',
  description: null,
  category: 'educación',
  localidad: 'Madrid',
  date: '2030-06-10T09:00:00.000Z',
  shift: 'mañana',
  status: 'confirmed',
  ...overrides,
});

const waitlistEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'wl-1',
  activity_type_id: TYPE_ID,
  name: 'Taller de lectura',
  localidad: 'Madrid',
  date: '2030-06-10T09:00:00.000Z',
  shift: 'mañana',
  position: 1,
  status: 'waiting',
  offer_expires_at: null,
  ...overrides,
});

function setupFetch(responses: Array<{ match: (url: string, init?: RequestInit) => boolean; body: unknown }>) {
  const fetchMock = jest.fn((url: string, init?: RequestInit) => {
    const r = responses.find((x) => x.match(String(url), init));
    if (!r) return Promise.reject(new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`));
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(r.body),
    } as Response);
  });
  global.fetch = fetchMock as jest.Mock;
  return fetchMock;
}

describe('portal actividades page', () => {
  afterEach(() => { jest.resetAllMocks(); });

  it('renders the derived calendar with name, date, shift, locality and capacity', async () => {
    setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [calendarEntry()] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [] },
      { match: (u) => u.includes('/api/activities/my-waitlist'), body: [] },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);

    expect(await screen.findByText('Taller de lectura')).toBeInTheDocument();
    expect(screen.getByText('Calendario')).toBeInTheDocument();
    expect(screen.getByText('7/10 plazas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument();
  });

  it('books by triple when clicking Reservar', async () => {
    const fetchMock = setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [calendarEntry()] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [] },
      { match: (u) => u.includes('/api/activities/my-waitlist'), body: [] },
      { match: (u) => u.includes(`/api/activities/${TYPE_ID}/book`), body: {} },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);
    const button = await screen.findByRole('button', { name: 'Reservar' });
    await userEvent.click(button);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST');
      expect(call).toBeDefined();
      const [, init] = call as [string, RequestInit];
      expect(init.method).toBe('POST');
      expect(JSON.parse(String(init.body))).toEqual({ date: '2030-06-10T09:00:00.000Z', shift: 'mañana' });
    });
  });

  it('offers joining the waitlist when the entry is full', async () => {
    setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [calendarEntry({ available: 0, bookedCount: 10, waitlistCount: 2 })] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [] },
      { match: (u) => u.includes('/api/activities/my-waitlist'), body: [] },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);

    expect(await screen.findByRole('button', { name: 'Unirse a lista de espera' })).toBeInTheDocument();
    expect(screen.getByText('2 personas en lista de espera')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reservar' })).not.toBeInTheDocument();
  });

  it('shows "Mis Reservas" with a cancel flow and 24h warning modal', async () => {
    setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [booking()] },
      { match: (u) => u.includes('/api/activities/my-waitlist'), body: [] },
      { match: (u) => u.includes('/api/activities/bookings/booking-1/cancel'), body: { message: 'Reserva cancelada' } },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);

    expect(await screen.findByText('Mis reservas')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('¿Cancelar reserva?')).toBeInTheDocument();
    expect(screen.getByText(/menos de 24 horas/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva' }));

    await waitFor(() => {
      expect(screen.getByText('Reserva cancelada')).toBeInTheDocument();
    });
  });

  it('shows pending offers with deadline and accept/decline actions', async () => {
    setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [] },
      {
        match: (u) => u.includes('/api/activities/my-waitlist'),
        body: [waitlistEntry({ status: 'offered', offer_expires_at: '2030-01-01T12:00:00.000Z' })],
      },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);

    expect(await screen.findByText('Ofertas recibidas')).toBeInTheDocument();
    expect(screen.getByText(/Caduca:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar oferta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar oferta' })).toBeInTheDocument();
  });

  it('warns about expired offers', async () => {
    setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [] },
      {
        match: (u) => u.includes('/api/activities/my-waitlist'),
        body: [
          waitlistEntry({ id: 'wl-x', status: 'expired', offer_expires_at: '2020-01-01T12:00:00.000Z' }),
          waitlistEntry({ id: 'wl-y', status: 'waiting' }),
        ],
      },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);

    expect(await screen.findByText(/han expirado/i)).toBeInTheDocument();
    expect(await screen.findByText('En espera')).toBeInTheDocument();
  });

  it('marks already booked entries on the calendar', async () => {
    setupFetch([
      { match: (u) => u.includes('/api/activities/upcoming'), body: [calendarEntry()] },
      { match: (u) => u.includes('/api/activities/my-bookings'), body: [booking()] },
      { match: (u) => u.includes('/api/activities/my-waitlist'), body: [] },
    ]);

    render(<TestProviders><ActividadesPortalPage /></TestProviders>);

    expect(await screen.findAllByText('Ya tienes reserva')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Reservar' })).not.toBeInTheDocument();
  });
});
