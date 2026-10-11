import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToysStockPage from './page';
import { TestProviders } from '@/app/test-utils';

let mockEnabled = true;

// jsdom lacks scrollIntoView, which Radix Select calls when opening.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

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

const ROW = {
  id: 't1',
  title: 'Trompo',
  description: 'Gira',
  ageBand: 'y5_7',
  ean: '2910000000017',
  quantity: 5,
  location: 'E1',
  pictures: [] as string[],
  cover: null,
};

describe('ToysStockPage', () => {
  beforeEach(() => {
    mockEnabled = true;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function base(handler?: (url: string, init?: RequestInit) => unknown) {
    setupFetch((url, init) => {
      if (url.endsWith('/status')) return { flag: 'toy_handout', enabled: mockEnabled };
      if (url.endsWith('/items') && (!init || !init.method || init.method === 'GET')) {
        if (handler) return handler(url, init);
        return [];
      }
      if (handler) return handler(url, init);
      throw new Error(`unmatched fetch: ${url}`);
    });
    render(
      <TestProviders>
        <ToysStockPage />
      </TestProviders>,
    );
  }

  it('auto-loads the stock table with EAN and band columns', async () => {
    base((url) => {
      if (url.endsWith('/items')) return [{ ...ROW }];
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    const row = await screen.findByTestId('toys-row-t1');
    expect(row).toHaveTextContent('Trompo');
    expect(row).toHaveTextContent('2910000000017');
    expect(row).toHaveTextContent('5-7 Años');
  });

  it('creates an item with EAN, band and location in the modal', async () => {
    const seen: string[] = [];
    base((url, init) => {
      if (url.endsWith('/items') && init?.method === 'POST') {
        seen.push(String(init.body));
        return { id: 't9' };
      }
      if (url.endsWith('/items')) return [{ ...ROW, id: 't9', title: 'Muñeca', ean: '2910000000024' }];
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-add-open'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-modal')).toBeInTheDocument());

    // Description is a textarea in the modal.
    expect(screen.getByTestId('toys-edit-desc').tagName).toBe('TEXTAREA');
    // Location defaults to the warehouse.
    expect(screen.getByTestId('toys-edit-loc')).toHaveTextContent('Almacén');

    await userEvent.type(screen.getByTestId('toys-edit-ean'), '2910000000024');
    await userEvent.type(screen.getByTestId('toys-edit-title'), 'Muñeca');
    await userEvent.type(screen.getByTestId('toys-edit-desc'), 'Suave');
    // Radix Select inside a Dialog only opens via keyboard in jsdom.
    screen.getByTestId('toys-edit-loc').focus();
    fireEvent.keyDown(screen.getByTestId('toys-edit-loc'), { key: 'ArrowDown', code: 'ArrowDown' });
    await userEvent.click(await screen.findByRole('option', { name: 'Tienda' }));
    await userEvent.click(screen.getByTestId('toys-edit-save'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-result')).toHaveTextContent('ok: t9'));
    expect(seen.some((b) => b.includes('2910000000024') && b.includes('y5_7') && b.includes('"location":"store"'))).toBe(true);
    // Pictures can be attached right after creation.
    expect(screen.getByTestId('toys-edit-upload-btn')).toBeInTheDocument();
  }, 15000);

  it('filters the table with a debounced search', async () => {
    base((url) => {
      if (url.endsWith('/items'))
        return [
          { ...ROW },
          { ...ROW, id: 't2', title: 'Pelota', description: 'Bota', ageBand: 'y3_4', ean: '2910000000031' },
        ];
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t2')).toBeInTheDocument());

    await userEvent.type(screen.getByTestId('toys-stock-search'), 'pelota');
    await waitFor(() => expect(screen.queryByTestId('toys-row-t1')).not.toBeInTheDocument());
    expect(screen.getByTestId('toys-row-t2')).toBeInTheDocument();

    await userEvent.clear(screen.getByTestId('toys-stock-search'));
    await userEvent.type(screen.getByTestId('toys-stock-search'), '2910000000017');
    await waitFor(() => expect(screen.getByTestId('toys-row-t1')).toBeInTheDocument());
    expect(screen.queryByTestId('toys-row-t2')).not.toBeInTheDocument();
  });

  it('paginates the table ten rows at a time', async () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({ ...ROW, id: `t${i}`, title: `Juguete ${i}` }));
    base((url) => {
      if (url.endsWith('/items')) return rows;
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t9')).toBeInTheDocument());
    expect(screen.queryByTestId('toys-row-t10')).not.toBeInTheDocument();
    expect(screen.getByTestId('toys-page-info')).toHaveTextContent('Página 1 de 2');

    await userEvent.click(screen.getByTestId('toys-next-page'));
    await waitFor(() => expect(screen.getByTestId('toys-row-t10')).toBeInTheDocument());
    expect(screen.queryByTestId('toys-row-t0')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('toys-prev-page'));
    await waitFor(() => expect(screen.getByTestId('toys-row-t0')).toBeInTheDocument());
  });

  it('edits EAN, band and all fields in the modal and saves', async () => {
    base((url, init) => {
      if (url.endsWith('/items')) return [{ ...ROW }];
      if (url.includes('/items/t1') && init?.method === 'PATCH')
        return { ...ROW, ean: '2910000000024', title: 'Trompo grande', ageBand: 'y8_11', quantity: 9 };
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t1')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-edit-t1'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-modal')).toBeInTheDocument());

    await userEvent.clear(screen.getByTestId('toys-edit-ean'));
    await userEvent.type(screen.getByTestId('toys-edit-ean'), '2910000000024');
    await userEvent.clear(screen.getByTestId('toys-edit-title'));
    await userEvent.type(screen.getByTestId('toys-edit-title'), 'Trompo grande');
    // Radix Select inside a Dialog only opens via keyboard in jsdom.
    screen.getByTestId('toys-edit-band').focus();
    fireEvent.keyDown(screen.getByTestId('toys-edit-band'), { key: 'ArrowDown', code: 'ArrowDown' });
    await userEvent.click(await screen.findByRole('option', { name: '8-11 Años' }));
    await userEvent.clear(screen.getByTestId('toys-edit-qty'));
    await userEvent.type(screen.getByTestId('toys-edit-qty'), '9');
    await userEvent.click(screen.getByTestId('toys-edit-save'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-result')).toHaveTextContent('Guardado: Trompo grande'));
  });

  it('manages pictures in the modal (upload, cover, remove)', async () => {
    base((url, init) => {
      if (url.endsWith('/items'))
        return [{ ...ROW, title: 'Cometa', ageBand: 'y5_7', pictures: ['/pic/a.png', '/pic/b.png'], cover: '/pic/a.png' }];
      if (url.includes('/pictures/') && init?.method === 'DELETE')
        return { ...ROW, pictures: ['/pic/b.png'], cover: '/pic/b.png' };
      if (url.includes('/pictures')) return { ...ROW, pictures: ['/pic/a.png', '/pic/b.png'], cover: '/pic/a.png' };
      if (url.includes('/cover')) return { ...ROW, pictures: ['/pic/a.png', '/pic/b.png'], cover: '/pic/b.png' };
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t1')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-edit-t1'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-pics')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-edit-cover-b.png'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-result')).toHaveTextContent('Portada: /pic/b.png'));

    await userEvent.click(screen.getByTestId('toys-edit-remove-a.png'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-result')).toHaveTextContent('Quitar foto: a.png'));
  });

  it('uploads extra pictures from the modal', async () => {
    base((url, init) => {
      if (url.endsWith('/items')) return [{ ...ROW, title: 'Camión' }];
      if (url.includes('/pictures')) return { ...ROW, pictures: ['/pic/a.png', '/pic/b.png'], cover: '/pic/a.png' };
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t1')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-edit-t1'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-modal')).toBeInTheDocument());

    const png = new File(['x'], 'foto.png', { type: 'image/png' });
    await userEvent.upload(screen.getByTestId('toys-edit-upload'), png);
    await waitFor(() => expect(screen.getByTestId('toys-edit-result')).toHaveTextContent('Fotos: 2'));
  });

  it('holds pictures picked before saving and uploads them on create', async () => {
    const seen: string[] = [];
    base((url, init) => {
      if (url.endsWith('/items') && init?.method === 'POST') {
        seen.push(`POST ${String(init.body).slice(0, 60)}`);
        return { id: 't9', title: 'Muñeca', ean: '2910000000024', pictures: [], cover: null };
      }
      if (url.includes('/items/t9/pictures')) {
        seen.push('UPLOAD');
        return { id: 't9', pictures: ['/pic/a.png'], cover: '/pic/a.png' };
      }
      if (url.endsWith('/items')) return [];
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-add-open'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-modal')).toBeInTheDocument());

    const png = new File(['x'], 'foto.png', { type: 'image/png' });
    await userEvent.upload(screen.getByTestId('toys-edit-upload'), png);
    await waitFor(() => expect(screen.getByTestId('toys-edit-pending')).toHaveTextContent('Fotos: 1'));

    await userEvent.type(screen.getByTestId('toys-edit-ean'), '2910000000024');
    await userEvent.type(screen.getByTestId('toys-edit-title'), 'Muñeca');
    await userEvent.click(screen.getByTestId('toys-edit-save'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-result')).toHaveTextContent('ok: t9'));
    expect(seen).toContain('UPLOAD');
  });

  it('opens the lightbox from a thumbnail and walks pictures', async () => {
    base((url) => {
      if (url.endsWith('/items'))
        return [{ ...ROW, pictures: ['/pic/a.png', '/pic/b.png'], cover: '/pic/a.png' }];
      throw new Error(`unmatched fetch: ${url}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t1')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-edit-t1'));
    await waitFor(() => expect(screen.getByTestId('toys-edit-pics')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-thumb-a.png'));
    await waitFor(() => expect(screen.getByTestId('toys-lightbox')).toBeInTheDocument());
    expect(screen.getByTestId('toys-lightbox-img')).toHaveAttribute('src', expect.stringContaining('/pic/a.png'));
    expect(screen.getByTestId('toys-lightbox-count')).toHaveTextContent('1 / 2');

    await userEvent.click(screen.getByTestId('toys-lightbox-next'));
    await waitFor(() => expect(screen.getByTestId('toys-lightbox-count')).toHaveTextContent('2 / 2'));
    expect(screen.getByTestId('toys-lightbox-img')).toHaveAttribute('src', expect.stringContaining('/pic/b.png'));

    await userEvent.click(screen.getByTestId('toys-lightbox-close'));
    await waitFor(() => expect(screen.queryByTestId('toys-lightbox')).not.toBeInTheDocument());
    // Closing the lightbox keeps the edit modal open.
    expect(screen.getByTestId('toys-edit-modal')).toBeInTheDocument();
  });

  it('deletes an item from the table', async () => {
    base((url, init) => {
      if (url.endsWith('/items')) return [{ ...ROW }];
      if (url.includes('/items/t1') && init?.method === 'DELETE') return { deleted: true };
      throw new Error(`unmatched fetch: ${url} ${init?.method ?? 'GET'}`);
    });
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('toys-row-t1')).toBeInTheDocument());

    await userEvent.click(screen.getByTestId('toys-delete-t1'));
    await waitFor(() => expect(screen.getByTestId('toys-item-result')).toHaveTextContent('Eliminado'));
  });

  it('links back to the console', async () => {
    base();
    await waitFor(() => expect(screen.getByTestId('toys-stock-page')).toBeInTheDocument());
    expect(screen.getByTestId('toys-console-link')).toHaveAttribute('href', expect.stringContaining('/admin/toys'));
  });

  it('denies the stock page when the flag is off', async () => {
    mockEnabled = false;
    base();
    await waitFor(() => expect(screen.getByTestId('toys-denied')).toBeInTheDocument());
  });
});
