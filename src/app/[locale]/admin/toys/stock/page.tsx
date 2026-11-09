'use client';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, ImageOff, Minus, Plus, Search } from 'lucide-react';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AGE_BANDS } from '@/lib/toyBands';
import { TOY_LOCATIONS } from '@/lib/toyLocations';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { useToys } from '../useToys';
import { ToysHeader } from '../_components/ToysHeader';
import { stockLevel } from '../campaign';
import { ItemEditModal, type StockItem } from './ItemEditModal';

const PAGE_SIZE = 24;

export default function ToysStockPage() {
  const t = useTranslations('admin.toys');
  const tc = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [out, setOut] = useState<{ text: string; error: boolean } | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [modal, setModal] = useState<{ item: StockItem | null } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [band, setBand] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const loadStock = useCallback(async () => {
    const r = await api.listItems();
    setReady(true);
    if (!r.success) {
      setOut({ text: t('inv.errorCargar', { error: r.error }), error: true });
      return;
    }
    setStock(r.data as StockItem[]);
  }, [api, t]);

  useEffect(() => {
    if (!loaded && api.status?.enabled) {
      setLoaded(true);
      void loadStock();
    }
  }, [api.status, loaded, loadStock]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t('loginRequerido')}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t('apagado')}</p>;

  const changeQty = async (item: StockItem, delta: number) => {
    setBusy(item.id);
    // Atomic on the server: two people pressing at once never lose a unit.
    const r = await api.adjustItem(item.id, delta);
    setBusy(null);
    if (!r.success) return setOut({ text: t('inv.errorGuardar', { error: r.error }), error: true });
    const next = Number(r.data?.quantity ?? 0);
    setStock((list) => list.map((s) => (s.id === item.id ? { ...s, quantity: next } : s)));
    setOut({ text: t('inv.unidadesAhora', { title: item.title ?? item.article ?? '', n: next }), error: false });
  };

  const units = stock.reduce((acc, s) => acc + (s.quantity ?? 0), 0);
  const byBand = band === 'all' ? stock : stock.filter((s) => s.ageBand === band);
  const visible =
    debouncedQuery === ''
      ? byBand
      : byBand.filter((s) =>
        [s.title ?? '', s.description ?? '', s.ean ?? '', s.location ?? ''].join(' ').toLowerCase().includes(debouncedQuery),
      );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = visible.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const isEmpty = ready && stock.length === 0;

  const addButton = (testid: string, label: string) => (
    <Button data-testid={testid} variant="cta" className="h-11 px-5" onClick={() => setModal({ item: null })}>
      <Plus aria-hidden="true" />
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8" data-testid="toys-stock-page">
      <ToysHeader
        active="inventario"
        title={t('inventario')}
        subtitle={isEmpty ? t('inv.vacioSub') : t('inv.resumen', { types: stock.length, units })}
        actions={addButton('toys-add-open', t('inv.anadirJuguete'))}
      />

      {isEmpty ? (
        <section data-testid="toys-empty" className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-xs">
          <span className="mb-4 flex size-24 items-center justify-center rounded-full bg-accent text-primary" aria-hidden="true"><Gift className="size-12" /></span>
          <h2 className="font-heading text-2xl font-bold">{t('inv.vacioTitulo')}</h2>
          <p className="mb-6 mt-2 text-muted-foreground">{t('inv.vacioTexto')}</p>
          {addButton('toys-empty-add', t('inv.anadirPrimero'))}
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                data-testid="toys-stock-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('inv.buscar')}
                aria-label={t('inv.buscar')}
                className="h-11 pl-9"
              />
            </div>
            <div role="group" aria-label={t('edad')} className="flex flex-wrap gap-2">
              {['all', ...AGE_BANDS].map((b) => (
                <button
                  key={b}
                  type="button"
                  data-testid={`toys-age-filter-${b}`}
                  aria-pressed={band === b}
                  onClick={() => { setBand(b); setPage(0); }}
                  className={cn(
                    'min-h-10 rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    band === b ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'bg-card hover:bg-accent',
                  )}
                >
                  {b === 'all' ? t('inv.todasEdades') : t(`bandas.${b}`)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="toys-count">
            {t('inv.mostrando', { n: visible.length, total: stock.length })}
          </p>

          {ready && visible.length === 0 ? (
            <div data-testid="toys-no-results" className="rounded-xl border border-dashed bg-card p-8 text-center">
              <p className="font-heading text-lg font-semibold">{t('inv.sinResultados')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('inv.sinResultadosTexto')}</p>
              <Button variant="outline" className="mt-4 h-11" onClick={() => { setQuery(''); setBand('all'); }}>{t('inv.limpiarFiltros')}</Button>
            </div>
          ) : (
            <ul data-testid="toys-stock" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
              {rows.map((s) => {
                const shown = s.cover ?? s.pictures?.[0] ?? null;
                const title = s.title ?? s.article ?? '';
                const level = stockLevel(s.quantity ?? 0);
                const loc = (TOY_LOCATIONS as readonly string[]).includes(s.location ?? '') ? t(`ubicaciones.${s.location}`) : (s.location ?? '');
                return (
                  <li key={s.id} data-testid={`toys-row-${s.id}`} className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
                    <button
                      type="button"
                      data-testid={`toys-edit-${s.id}`}
                      onClick={() => setModal({ item: s })}
                      aria-label={t('inv.editarAria', { title })}
                      className="group flex flex-1 flex-col text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                    >
                      <span className="relative block aspect-[4/3] w-full bg-muted">
                        {shown ? (
                          <img src={`${getApiBaseUrl()}${shown}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                            <ImageOff className="size-6" aria-hidden="true" />
                            {t('inv.sinFoto')}
                          </span>
                        )}
                      </span>
                      <span className="flex flex-col gap-2 p-3">
                        <span className="font-heading text-base font-semibold leading-snug group-hover:text-primary">{title}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="rounded-full bg-accent px-2.5 py-0.5 font-semibold text-primary">
                            {s.ageBand ? t(`bandas.${s.ageBand}`) : s.age}
                          </span>
                          {loc && <span className="text-muted-foreground">· {loc}</span>}
                        </span>
                        {s.ean && <span className="sr-only">{t('ean')}: {s.ean}</span>}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
                      <span
                        data-testid={`toys-qty-${s.id}`}
                        className={cn(
                          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          level === 'ok' && 'bg-success/10 text-success',
                          level === 'low' && 'bg-[#fbf0d9] text-[#7a5200]',
                          level === 'out' && 'bg-destructive/10 text-destructive',
                        )}
                      >
                        <span className="size-2 rounded-full bg-current" aria-hidden="true" />
                        {level === 'out' ? t('inv.agotado') : level === 'low' ? t('inv.quedan', { n: s.quantity }) : t('inv.enStock', { n: s.quantity })}
                      </span>
                      <span className="flex gap-1">
                        <Button
                          data-testid={`toys-qty-minus-${s.id}`}
                          variant="outline"
                          size="icon"
                          className="size-11"
                          disabled={busy === s.id || (s.quantity ?? 0) <= 0}
                          aria-label={t('inv.quitarUna', { title })}
                          onClick={() => changeQty(s, -1)}
                        >
                          <Minus aria-hidden="true" />
                        </Button>
                        <Button
                          data-testid={`toys-qty-plus-${s.id}`}
                          variant="outline"
                          size="icon"
                          className="size-11"
                          disabled={busy === s.id}
                          aria-label={t('inv.anadirUna', { title })}
                          onClick={() => changeQty(s, 1)}
                        >
                          <Plus aria-hidden="true" />
                        </Button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <Button data-testid="toys-prev-page" variant="outline" className="h-11" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>
                {tc('anterior')}
              </Button>
              <span data-testid="toys-page-info">{t('pagina')} {safePage + 1} {t('de')} {pageCount}</span>
              <Button data-testid="toys-next-page" variant="outline" className="h-11" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                {tc('siguiente')}
              </Button>
            </div>
          )}
        </>
      )}

      {out && (
        <p data-testid="toys-item-result" role={out.error ? 'alert' : 'status'} className={cn('text-sm', out.error ? 'text-destructive' : 'text-muted-foreground')}>
          {out.text}
        </p>
      )}

      {modal && (
        <ItemEditModal
          key={modal.item?.id ?? 'new'}
          item={modal.item}
          onClose={() => setModal(null)}
          onChanged={() => loadStock()}
          onDeleted={() => {
            setModal(null);
            setOut({ text: t('eliminado'), error: false });
            void loadStock();
          }}
        />
      )}
    </div>
  );
}
