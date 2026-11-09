import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToysAdminPage from './page';
import { TestProviders } from '@/app/test-utils';

let mockEnabled = true;

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Staff' }, authToken: 'token123' }, status: 'authenticated' }),
}));

jest.mock('@/app/auth/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

function setupFetch(handler: (url: string, init?: RequestInit) => unknown) {
  global.fetch = jest.fn((url: string, init?: RequestInit) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(handler(String(url), init)) } as Response),
  ) as jest.Mock;
}

describe('ToysAdminPage', () => {
  beforeEach(() => {
    mockEnabled = true;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function base(handler?: (url: string, init?: RequestInit) => unknown) {
    setupFetch((url, init) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: mockEnabled };
      if (handler) return handler(url, init);
      throw new Error(`unmatched fetch: ${url}`);
    });
    render(
      <TestProviders>
        <ToysAdminPage />
      </TestProviders>,
    );
  }

  it('adds a child', async () => {
    base((url) => {
      if (url.endsWith('/children')) return { id: 'c1' };
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-console')).toBeInTheDocument());

    await userEvent.type(screen.getByTestId('toys-child-label'), 'N-1');
    await userEvent.click(screen.getByTestId('toys-child-add'));
    await waitFor(() => expect(screen.getByTestId('toys-child-result')).toHaveTextContent('ok: c1'));
  });

  it('links to the stock page', async () => {
    base(() => {
      throw new Error('unmatched fetch');
    });
    await waitFor(() => expect(screen.getByTestId('toys-console')).toBeInTheDocument());
    const link = screen.getByTestId('toys-stock-link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/admin/toys/stock'));
  });

  it('scans a QR and closes an item with destination', async () => {
    base((url) => {
      if (url.endsWith('/scan')) return { collected: true, decremented: [{ toy_id: 't1', qty: 2 }] };
      if (url.endsWith('/close')) return { id: 'd1', destination: 'almacén central' };
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-console')).toBeInTheDocument());

    await userEvent.type(screen.getByTestId('toys-scan-token'), 'qr-1');
    await userEvent.click(screen.getByTestId('toys-scan-run'));
    await waitFor(() => expect(screen.getByTestId('toys-scan-result')).toHaveTextContent('collected: 1'));

    await userEvent.type(screen.getByTestId('toys-close-toy'), 't1');
    await userEvent.type(screen.getByTestId('toys-close-dest'), 'almacén central');
    await userEvent.click(screen.getByTestId('toys-close-run'));
    await waitFor(() => expect(screen.getByTestId('toys-close-result')).toHaveTextContent('almacén central'));
  });

  it('picks a beneficiary and uploads a csv', async () => {
    base((url) => {
      if (url.endsWith('/beneficiaries')) return [{ member_id: 'm1', name: 'Familia Demo', email: 'f@test.com' }];
      if (url.endsWith('/from-member')) return { id: 'c9', label: 'Familia Demo' };
      if (url.endsWith('/upload')) return { created: 2, skipped: 1 };
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-console')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-beneficiaries-load'));
    await waitFor(() => expect(screen.getByTestId('toys-child-result')).toHaveTextContent('1 beneficiarios'));

    const file = new File(['nombre,edad\nN-1,5\n'], 'lista.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByTestId('toys-upload-file'), file);
    await waitFor(() => expect(screen.getByTestId('toys-child-result')).toHaveTextContent('Creados: 2'));
  });

  it('shows a camera error when no camera exists', async () => {
    base(() => {
      throw new Error('unmatched fetch');
    });
    await waitFor(() => expect(screen.getByTestId('toys-console')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('toys-scan-camera'));
    await waitFor(() => expect(screen.getByTestId('toys-scan-result')).toHaveTextContent(/cámara/i));
  });

  it('denies the console when the flag is off', async () => {
    mockEnabled = false;
    base();
    await waitFor(() => expect(screen.getByTestId('toys-denied')).toBeInTheDocument());
  });
});
