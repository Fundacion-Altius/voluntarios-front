import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '@/app/test-utils';
import { POLL_INTERVAL_MS } from '@/modules/comandero/useComandero';
import ComanderoPortalPage from './page';

const SESSION_ID = '9d3a5e0c-7a41-4b8e-9a52-0c1f2d3e4f50';
const mediodia = {
  id: SESSION_ID,
  label: 'Servicio mediodía 12-nov',
  status: 'activa',
  started_at: '2026-11-12T11:30:00.000Z',
};
const cena = {
  id: 'b2c4d6e8-0000-4000-8000-000000000002',
  label: 'Servicio cena',
  status: 'activa',
  started_at: '2026-11-12T19:00:00.000Z',
};

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

/** Serves the open-services list from `current()`, an empty floor/snapshot and an empty station queue. */
function mockApi(current: () => unknown[]) {
  const calls = { list: 0 };
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/api/comandero/sessions')) {
      calls.list += 1;
      return jsonResponse(current()) as ReturnType<typeof fetch>;
    }
    if (url.includes('/floor')) return jsonResponse({ session_id: SESSION_ID, tables: [] }) as ReturnType<typeof fetch>;
    if (url.includes('/snapshot') || url.includes('/stations/')) return jsonResponse([]) as ReturnType<typeof fetch>;
    return jsonResponse({}, 404) as ReturnType<typeof fetch>;
  }) as unknown as typeof fetch;
  return calls;
}

const renderPage = () =>
  render(
    <TestProviders>
      <ComanderoPortalPage />
    </TestProviders>,
  );

describe('Comandero portal: join a service by name', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('lists the open services by name and never shows an identifier', async () => {
    mockApi(() => [mediodia, cena]);
    renderPage();

    const options = await screen.findAllByTestId('comandero-portal-session-option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Servicio mediodía 12-nov');
    expect(options[1]).toHaveTextContent('Servicio cena');
    expect(document.body).not.toHaveTextContent(SESSION_ID);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('joins a service, shows its name and offers the three roles', async () => {
    mockApi(() => [mediodia]);
    renderPage();

    await userEvent.click(await screen.findByTestId('comandero-portal-session-option'));

    expect(await screen.findByTestId('comandero-portal-current')).toHaveTextContent('Servicio mediodía 12-nov');
    expect(screen.getByTestId('comandero-tab-camarero')).toBeInTheDocument();
    expect(screen.getByTestId('comandero-tab-cocina')).toBeInTheDocument();
    expect(screen.getByTestId('comandero-tab-barra')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(SESSION_ID);
  });

  it('goes back to the list with "change service"', async () => {
    mockApi(() => [mediodia, cena]);
    renderPage();

    await userEvent.click((await screen.findAllByTestId('comandero-portal-session-option'))[1]);
    expect(await screen.findByTestId('comandero-portal-current')).toHaveTextContent('Servicio cena');

    await userEvent.click(screen.getByTestId('comandero-portal-change-session'));
    expect(await screen.findAllByTestId('comandero-portal-session-option')).toHaveLength(2);
    expect(screen.queryByTestId('comandero-portal-current')).not.toBeInTheDocument();
  });
});

describe('Comandero portal: no service open, or the service gets closed', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('explains there is no open service and lets the student refresh', async () => {
    const calls = mockApi(() => []);
    renderPage();

    expect(await screen.findByTestId('comandero-portal-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('comandero-portal-session-option')).not.toBeInTheDocument();

    const before = calls.list;
    await userEvent.click(screen.getByTestId('comandero-portal-refresh'));
    await waitFor(() => expect(calls.list).toBeGreaterThan(before));
  });

  it('tells the student when the teacher closes the service they are in', async () => {
    jest.useFakeTimers();
    let open: unknown[] = [mediodia];
    mockApi(() => open);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderPage();

    await user.click(await screen.findByTestId('comandero-portal-session-option'));
    expect(await screen.findByTestId('comandero-portal-current')).toBeInTheDocument();

    open = [];
    await act(async () => {
      jest.advanceTimersByTime(POLL_INTERVAL_MS + 50);
    });

    expect(await screen.findByTestId('comandero-portal-closed')).toBeInTheDocument();
    expect(screen.queryByTestId('comandero-portal-current')).not.toBeInTheDocument();
  });
});
