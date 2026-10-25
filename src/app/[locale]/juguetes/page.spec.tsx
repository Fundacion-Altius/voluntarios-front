import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JuguetesPage from './page';
import { TestProviders } from '@/app/test-utils';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

function setupFetch(handler: (url: string, init?: RequestInit) => unknown) {
  global.fetch = jest.fn((url: string, init?: RequestInit) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(handler(String(url), init)) } as Response),
  ) as jest.Mock;
}

describe('JuguetesPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('clusters all ages on auto-load', async () => {
    setupFetch((url, init) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: true };
      if (url.includes('/items') && !url.includes('ageBand='))
        return [
          { id: 't1', title: 'Muñeca', description: 'Suave y grande', ageBand: 'y5_7', quantity: 4, location: 'A1', pictures: [] },
          { id: 't2', title: 'Pelota', description: 'Bota', ageBand: 'y3_4', quantity: 2, location: 'B2', pictures: [] },
        ];
      if (url.includes('/items?ageBand=')) return [{ id: 't1', title: 'Muñeca', description: 'Suave y grande', ageBand: 'y5_7', quantity: 4, location: 'A1', pictures: [] }];
      if (url.endsWith('/carts')) return { id: 'cart-1', lines: [] };
      if (url.includes('/lines')) {
        if (init?.method === 'DELETE') return { id: 'cart-1', lines: [] };
        return { id: 'cart-1', lines: [{ toy_id: 't1', qty: 2 }] };
      }
      if (url.includes('/checkout')) return { qr_token: 'qr-abc', lines: [{ toy_id: 't1', qty: 1 }] };
      if (url.endsWith('/slots')) return [{ id: 's1', date: '2026-12-20', label: 'mañana' }];
      if (url.includes('/book')) return { id: 'b1', notify_channel: 'unknown' };
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-console')).toBeInTheDocument());

    await waitFor(() => expect(screen.getByTestId('juguetes-out')).toHaveTextContent('2 elementos'));
    expect(screen.getByTestId('juguetes-clusters')).toBeInTheDocument();
    expect(screen.getByTestId('juguetes-age')).not.toBeVisible();
    expect(screen.getByTestId('juguetes-cluster-y3_4')).toHaveTextContent('Edad: 3-4 Años');
    expect(screen.getByTestId('juguetes-cluster-y5_7')).toHaveTextContent('Edad: 5-7 Años');
    expect(screen.getByTestId('juguetes-title-t1')).toHaveTextContent('Muñeca');
    expect(screen.getByTestId('juguetes-desc-t1')).toHaveTextContent('Suave y grande');

    expect(screen.getByTestId('juguetes-add-t1')).toBeDisabled();
    await userEvent.click(screen.getByTestId('juguetes-plus-t1'));
    await userEvent.click(screen.getByTestId('juguetes-plus-t1'));
    expect(screen.getByTestId('juguetes-qty-t1')).toHaveTextContent('2');
    await userEvent.click(screen.getByTestId('juguetes-add-t1'));
    await waitFor(() => expect(screen.getByTestId('juguetes-incart-t1')).toHaveTextContent('En cesta: 2'));

    await userEvent.click(screen.getByTestId('juguetes-remove-t1'));
    await waitFor(() => expect(screen.queryByTestId('juguetes-incart-t1')).not.toBeInTheDocument());

    await userEvent.click(screen.getByTestId('juguetes-checkout'));
    await waitFor(() => expect(screen.getByTestId('juguetes-qr')).toHaveTextContent('QR: qr-abc'));

    await userEvent.click(screen.getByTestId('juguetes-slots'));
    await waitFor(() => expect(screen.getByTestId('juguetes-slot')).toBeInTheDocument());
  });
  it('filters by band dropdown', async () => {
    const seen: string[] = [];
    setupFetch((url, init) => {
      seen.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: true };
      if (url.includes('/items?ageBand=')) return [{ id: 't1', title: 'Muñeca', description: 'linda', ageBand: 'y5_7', quantity: 2, location: 'A1', pictures: [] }];
      if (url.includes('/items')) return [
        { id: 't1', title: 'Muñeca', description: 'linda', ageBand: 'y5_7', quantity: 2, location: 'A1', pictures: [] },
        { id: 't2', title: 'Pelota', description: 'bota', ageBand: 'y3_4', quantity: 2, location: 'B2', pictures: [] },
      ];
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-agefilter')).toBeInTheDocument());
    expect(screen.getByTestId('juguetes-agefilter')).toHaveDisplayValue('Todas');

    await userEvent.selectOptions(screen.getByTestId('juguetes-agefilter'), 'y5_7');
    await waitFor(() => expect(seen.some((c) => c.includes('/items?ageBand=y5_7'))).toBe(true));
    await waitFor(() => expect(screen.getByTestId('juguetes-grid')).toBeInTheDocument());
    console.log('DBG_DISPLAY:', (screen.getByTestId('juguetes-agefilter') as HTMLSelectElement).value);
    await waitFor(() => expect(screen.queryByTestId('juguetes-card-t2')).not.toBeInTheDocument());

    await userEvent.selectOptions(screen.getByTestId('juguetes-agefilter'), '');
    await waitFor(() => expect(screen.getByTestId('juguetes-clusters')).toBeInTheDocument());
  });

  it('keeps the parked age filter hidden and disabled', async () => {    setupFetch((url, init) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: true };
      if (url.includes('/items')) return [{ id: 't1', title: 'Muñeca', description: 'x', ageBand: 'y5_7', quantity: 4, location: 'A1', pictures: [] }];
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-out')).toHaveTextContent('1 elementos'));
    const age = screen.getByTestId('juguetes-age');
    expect(age).not.toBeVisible();
    expect(age).toBeDisabled();
    expect(screen.getByTestId('juguetes-clusters')).toBeInTheDocument();
  });

  it('opens the full image in a modal on click', async () => {
    setupFetch((url, init) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: true };
      if (url.includes('/items')) return [{ id: 't1', title: 'Muñeca', description: 'x', ageBand: 'y5_7', quantity: 4, location: 'A1', pictures: ['/api/toys/items/t1/pictures/a.png'] }];
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-console')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('juguetes-zoom-t1')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('juguetes-zoom-t1'));
    await waitFor(() => expect(screen.getByTestId('juguetes-modal')).toBeInTheDocument());
    expect(screen.getByTestId('juguetes-modal-img')).toHaveAttribute('src', expect.stringContaining('/pictures/a.png'));
  });

  it('opens a lightbox gallery and walks all pictures', async () => {
    setupFetch((url, init) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: true };
      if (url.includes('/items')) return [{ id: 't1', title: 'Casita', description: 'Casita con muebles y tres ambientes', ageBand: 'y5_7', quantity: 2, location: 'C2', cover: '/pic/a.png', pictures: ['/pic/a.png', '/pic/b.png', '/pic/c.png'] }];
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-console')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('juguetes-zoom-t1')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('juguetes-zoom-t1'));
    await waitFor(() => expect(screen.getByTestId('juguetes-modal')).toBeInTheDocument());
    expect(screen.getByTestId('juguetes-modal-desc')).toHaveTextContent('Casita con muebles y tres ambientes');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('juguetes-modal')).not.toBeInTheDocument());
    await userEvent.click(screen.getByTestId('juguetes-desc-t1'));
    await waitFor(() => expect(screen.getByTestId('juguetes-modal')).toBeInTheDocument());
    expect(screen.getByTestId('juguetes-modal-count')).toHaveTextContent('1 / 3');
    await userEvent.click(screen.getByTestId('juguetes-modal-next'));
    await waitFor(() => expect(screen.getByTestId('juguetes-modal-count')).toHaveTextContent('2 / 3'));
    expect(screen.getByTestId('juguetes-modal-img')).toHaveAttribute('src', expect.stringContaining('/pic/b.png'));
    await userEvent.click(screen.getByTestId('juguetes-modal-prev'));
    await waitFor(() => expect(screen.getByTestId('juguetes-modal-count')).toHaveTextContent('1 / 3'));
  });

  it('filters loaded cards client-side with debounce and no new query', async () => {
    const calls: string[] = [];
    setupFetch((url, init) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: true };
      if (url.includes('/items')) return [
        { id: 't1', title: 'Muñeca', description: 'linda', ageBand: 'y5_7', quantity: 2, location: 'A1', pictures: [] },
        { id: 't2', title: 'Pelota', description: 'bota', ageBand: 'y3_4', quantity: 2, location: 'B2', pictures: [] },
      ];
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-clusters')).toBeInTheDocument());
    expect(screen.getByTestId('juguetes-card-t1')).toBeInTheDocument();
    expect(screen.getByTestId('juguetes-card-t2')).toBeInTheDocument();

    await userEvent.type(screen.getByTestId('juguetes-search'), 'muñ');
    await waitFor(() => expect(screen.queryByTestId('juguetes-card-t2')).not.toBeInTheDocument());
    expect(screen.getByTestId('juguetes-card-t1')).toBeInTheDocument();
    expect(calls.filter((c) => c.includes('/items')).length).toBe(1);
  });

  it('denies the mini site when the flag is off', async () => {
    setupFetch((url) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: false };
      throw new Error(`unmatched fetch: ${url}`);
    });
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    await waitFor(() => expect(screen.getByTestId('juguetes-denied')).toBeInTheDocument());
  });
});

describe('ChristmasFooter', () => {
  it('shows one of the ten holiday messages after mount', async () => {
    setupFetch((url) => (url.endsWith('/status') ? { flag: 'toy_handout', enabled: true } : []));
    render(
      <TestProviders>
        <JuguetesPage />
      </TestProviders>,
    );
    const p = await screen.findByTestId('juguetes-xmas');
    await waitFor(() => expect(Number(p.getAttribute('data-n'))).toBeGreaterThan(0));
    expect(Number(p.getAttribute('data-n'))).toBeLessThanOrEqual(10);
    expect(p.textContent?.length).toBeGreaterThan(20);
  });
});
