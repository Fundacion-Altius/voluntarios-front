'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToys } from '../admin/toys/useToys';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { AGE_BANDS } from '@/lib/toyBands';
import './juguetes.css';

function Star({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.8l-5.7 3.3 1.5-6.5-5-4.4 6.6-.6z" />
    </svg>
  );
}

function Garland() {
  return (
    <svg className="jug-garland" aria-hidden="true" viewBox="0 0 360 220" preserveAspectRatio="xMaxYMin meet" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 18 Q 95 80 180 30 T 350 40" />
      {[[40,38],[95,56],[150,42],[205,30],[260,44],[315,40]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <line x1="0" y1="0" x2="0" y2={18 + (i % 3) * 14} />
          <circle cx="0" cy={26 + (i % 3) * 14} r={i % 2 ? 7 : 9} fill="currentColor" fillOpacity=".18" />
        </g>
      ))}
      <g transform="translate(300 150)" strokeWidth="1.2">
        {[0, 60, 120].map((a) => (<line key={a} x1="-22" y1="0" x2="22" y2="0" transform={`rotate(${a})`} />))}
      </g>
    </svg>
  );
}

function lightboxImages(item: any): string[] {
  return item.cover ? [item.cover, ...(item.pictures ?? []).filter((p: string) => p !== item.cover)] : (item.pictures ?? []);
}

function ToyCard({ item, qty, inCart, t, setPick, addLine, removeLine, onZoom }: {
  item: any;
  qty: number;
  inCart: number;
  t: (k: string) => string;
  setPick: (id: string, v: number) => void;
  addLine: (id: string) => void;
  removeLine: (id: string) => void;
  onZoom: (images: string[], alt: string, desc: string) => void;
}) {
  const shown = item.cover ?? item.pictures?.[0] ?? null;
  return (
    <Card data-testid={`juguetes-card-${item.id}`} className="flex flex-col overflow-hidden">
      {shown ? (
        <button
          type="button"
          data-testid={`juguetes-zoom-${item.id}`}
          onClick={() => onZoom(lightboxImages(item), item.title ?? item.article, item.description ?? '')}
          className="block w-full cursor-zoom-in p-0"
          aria-label={t('verGrande')}
        >
          <img
            src={`${getApiBaseUrl()}${shown}`}
            alt={item.title ?? item.article}
            className="aspect-square w-full object-cover"
            data-testid={`juguetes-img-${item.id}`}
          />
        </button>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-muted" data-testid={`juguetes-noimg-${item.id}`}>
          {t('sinFoto')}
        </div>
      )}
      <CardHeader>
        <CardTitle data-testid={`juguetes-title-${item.id}`}>{item.title ?? item.article}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
                    {item.description && (
                      <p
                        data-testid={`juguetes-desc-${item.id}`}
                        className="line-clamp-2 min-h-10 cursor-pointer"
                        title={t('verGrande')}
          onClick={() => onZoom(lightboxImages(item), item.title ?? item.article, item.description ?? '')}
                      >
                        {item.description}
                      </p>
                    )}
        <p className="text-sm text-muted-foreground">{t('edadEtiqueta')}: {t(`bandas.${item.ageBand}`)} · {t('quedan')}: {item.quantity}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              data-testid={`juguetes-minus-${item.id}`}
              disabled={qty <= 0}
              onClick={() => setPick(item.id, Math.max(0, qty - 1))}
              variant="outline"
              aria-label={t('menos')}
              className="h-11 w-11 text-lg"
            >
              −
            </Button>
            <span data-testid={`juguetes-qty-${item.id}`} className="min-w-6 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
            <Button
              data-testid={`juguetes-plus-${item.id}`}
              disabled={qty >= item.quantity}
              onClick={() => setPick(item.id, Math.min(item.quantity, qty + 1))}
              variant="outline"
              aria-label={t('mas')}
              className="h-11 w-11 text-lg"
            >
              +
            </Button>
          </div>
          <Button data-testid={`juguetes-add-${item.id}`} disabled={qty <= 0} onClick={() => addLine(item.id)} className="min-h-11 w-full">
            {t('anadir')}
          </Button>
        </div>
        {inCart > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-[var(--gold-soft)] px-2 text-sm">
            <span data-testid={`juguetes-incart-${item.id}`}>{t('enCesta')}: {inCart}</span>
            <Button variant="ghost" className="min-h-11" data-testid={`juguetes-remove-${item.id}`} onClick={() => removeLine(item.id)}>
              {t('quitar')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const XMAS_COUNT = 10;
const PAGE_SIZE = 12;

function Pager({ page, pages, onGo, t }: { page: number; pages: number; onGo: (p: number) => void; t: (k: string, v?: Record<string, number>) => string }) {
  if (pages < 2) return null;
  return (
    <nav aria-label={t('paginacion')} className="jug-pager" data-testid="juguetes-pager">
      <button type="button" className="jug-page" disabled={page <= 1} onClick={() => onGo(page - 1)} data-testid="juguetes-page-prev">
        ← <span className="max-sm:sr-only">{t('anterior')}</span>
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className="jug-page"
          aria-current={n === page ? 'page' : undefined}
          aria-label={t('paginaN', { n })}
          onClick={() => onGo(n)}
          data-testid={`juguetes-page-${n}`}
        >
          {n}
        </button>
      ))}
      <button type="button" className="jug-page" disabled={page >= pages} onClick={() => onGo(page + 1)} data-testid="juguetes-page-next">
        <span className="max-sm:sr-only">{t('siguiente')}</span> →
      </button>
    </nav>
  );
}

/** One of ten holiday messages, picked on the client after mount so SSR and hydration match. */
function ChristmasFooter({ t }: { t: (k: string) => string }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    setN(1 + Math.floor(Math.random() * XMAS_COUNT));
  }, []);
  return (
    <footer className="jug-footer" data-testid="juguetes-footer">
      <Star size={16} />
      <p data-testid="juguetes-xmas" data-n={n ?? ''}>{n ? t(`navidad.${n}`) : '\u00a0'}</p>
      <Star size={16} />
    </footer>
  );
}

function clusterByAge(catalog: any[]): { band: string; items: any[] }[] {
  const groups = new Map<string, any[]>();
  for (const item of catalog) {
    const band = String(item.ageBand ?? 'y5_7');
    const list = groups.get(band) ?? [];
    list.push(item);
    groups.set(band, list);
  }
  const clusters: { band: string; items: any[] }[] = [];
  for (const band of AGE_BANDS) {
    const items = groups.get(band);
    if (items) clusters.push({ band, items });
  }
  return clusters;
}

export default function JuguetesPage() {
  const t = useTranslations('juguetes');
  const api = useToys();
  const [age, setAge] = useState('');
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [household, setHousehold] = useState(() => `Familia ${String(Date.now()).slice(-4)}`);
  const [cartId, setCartId] = useState('');
  const [lines, setLines] = useState<{ toy_id: string; qty: number }[]>([]);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [qr, setQr] = useState('');
  const [qrPng, setQrPng] = useState('');
  const [out, setOut] = useState('');
  const [slotId, setSlotId] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [zoom, setZoom] = useState<{ images: string[]; index: number; alt: string; desc: string } | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const fail = (e: unknown) => {
    setError(String(e ?? ''));
    setOut(`ERROR: ${e ?? ''}`);
  };
  const [page, setPage] = useState(1);
  const listTop = useRef<HTMLElement>(null);
  const cartCount = lines.reduce((n, l) => n + l.qty, 0);

  const browse = async (override?: string) => {
    const trimmed = (override ?? age).trim();
    const filter = trimmed === '' ? null : trimmed;
    if (filter !== null && !AGE_BANDS.includes(filter as (typeof AGE_BANDS)[number])) return fail('');
    if (override !== undefined) setAge(override);
    setAgeFilter(filter);
    const r = await api.listItems(filter ?? undefined);
    if (!r.success) return fail(r.error);
    setError('');
    setLoaded(true);
    setCatalog(r.data as any[]);
    setOut(`${(r.data as any[]).length} ${t('items')}`);
  };

  const addLine = async (toyId: string) => {
    const qty = pick[toyId] ?? 0;
    if (qty <= 0) return;
    let id = cartId;
    if (!id) {
      const c = await api.createCart(household);
      if (!c.success) return fail(c.error);
      id = c.data.id;
      setCartId(id);
    }
    const r = await api.addLine(id, toyId, qty);
    if (!r.success) return fail(r.error);
    setLines(r.data.lines as { toy_id: string; qty: number }[]);
    setPick((p) => ({ ...p, [toyId]: 0 }));
    setOut(`${t('enCesta')}: ${(r.data.lines as any[]).length}`);
  };

  const removeLine = async (toyId: string) => {
    if (!cartId) return;
    const r = await api.removeLine(cartId, toyId);
    if (!r.success) return fail(r.error);
    setLines(r.data.lines as { toy_id: string; qty: number }[]);
    setOut(`${t('enCesta')}: ${(r.data.lines as any[]).length}`);
  };

  const checkout = async () => {
    if (!cartId) return fail('');
    const r = await api.checkout(cartId);
    if (!r.success) return fail(r.error);
    setQr(r.data.qr_token);
    setQrPng(`${getApiBaseUrl()}${r.data.qr_png_url}`);
    setOut(t('qrListo'));
  };

  const loadSlots = async () => {
    const r = await api.listSlots();
    if (!r.success) return fail(r.error);
    setSlots(r.data as any[]);
  };

  const book = async () => {
    if (!slotId) return fail('');
    const r = await api.bookSlot(slotId, household);
    if (!r.success) return fail(r.error);
    setOut(`${t('reservado')}: ${t('avisoCanal')}`);
  };

  useEffect(() => {
    if (!autoLoaded && api.status?.enabled) {
      setAutoLoaded(true);
      void browse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.status, autoLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleCatalog =
    debouncedQuery === ''
      ? catalog
      : catalog.filter(
          (item) =>
            (item.title ?? item.article ?? '').toLowerCase().includes(debouncedQuery) || (item.description ?? '').toLowerCase().includes(debouncedQuery),
        );

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, ageFilter]);
  const pages = Math.max(1, Math.ceil(visibleCatalog.length / PAGE_SIZE));
  const curPage = Math.min(page, pages);
  const pageItems = visibleCatalog.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const goPage = (n: number) => {
    setPage(n);
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const pt = (k: string, v?: Record<string, number>) => t(k, v);

  const agesPresent: string[] = [];
  catalog.forEach((item) => {
    const band = String(item.ageBand ?? '');
    if (band && !agesPresent.includes(band)) agesPresent.push(band);
  });
  agesPresent.sort((a, b) => AGE_BANDS.indexOf(a as (typeof AGE_BANDS)[number]) - AGE_BANDS.indexOf(b as (typeof AGE_BANDS)[number]));

  const cardProps = (item: any) => ({
    item,
    qty: pick[item.id] ?? 0,
    inCart: lines.find((l) => l.toy_id === item.id)?.qty ?? 0,
    t: (k: string) => t(k),
    setPick: (id: string, v: number) => setPick((p) => ({ ...p, [id]: v })),
    addLine,
    removeLine,
    onZoom: (images: string[], alt: string, desc: string) => setZoom({ images, index: 0, alt, desc }),
  });

  if (api.status && !api.status.enabled) return <p data-testid="juguetes-denied">{t('apagado')}</p>;

  return (
    <div className="jug mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:pb-6" data-testid="juguetes-console">
      <header className="jug-hero" data-testid="juguetes-hero">
        <Garland />
        <div className="relative flex flex-col gap-3">
          <span className="jug-eyebrow self-start"><Star size={14} />{t('titulo')}</span>
          <h1>{t.rich('saludo', { em: (c) => <em>{c}</em> })}</h1>
          <p className="jug-lead">{t('intro')}</p>
        </div>
      </header>
      <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" data-testid="juguetes-main">
        <section ref={listTop} aria-labelledby="juguetes-catalog-h" className="flex min-w-0 scroll-mt-4 flex-col gap-4">
          <h2 id="juguetes-catalog-h" className="sr-only">{t('catalogo')}</h2>
          <div className="jug-toolbar" data-testid="juguetes-toolbar">
            <label className="sr-only" htmlFor="juguetes-search">{t('buscar')}</label>
            <Input
              id="juguetes-search"
              type="search"
              data-testid="juguetes-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('buscar')}
              className="h-11 bg-card"
            />
            {agesPresent.length > 0 && (
              <div role="group" aria-label={t('filtrarEdad')} className="jug-chips" data-testid="juguetes-agefilter">
                {['', ...agesPresent].map((b) => (
                  <button
                    key={b || 'all'}
                    type="button"
                    className="jug-chip"
                    aria-pressed={(ageFilter ?? '') === b}
                    data-testid={`juguetes-age-${b || 'all'}`}
                    onClick={() => browse(b)}
                  >
                    {b ? t(`bandas.${b}`) : t('todasEdadesCorto')}
                  </button>
                ))}
              </div>
            )}
          </div>

      {/* PARKED 2026-09-24 (Carlos): "Todo es gratis" pill removed. */}

      {/*
        PARKED 2026-09-24 (Carlos): the whole "Explorar por edad" browse card
        (title, age filter, Ver button) is hidden — it did nothing useful and
        the catalog auto-loads on open, always clustered by age. The household
        input moved to the basket card. TO REVERT: re-render the Card block
        below (kept commented in git history) and drop the auto-load effect;
        the `browse` age parsing already handles both (empty = all, number =
        flat grid). See tasks.md in openspec/changes/december-toys-handout/.
      */}
      <div hidden aria-hidden="true">
        <Input
          data-testid="juguetes-age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder={t('todasEdades')}
          disabled
          tabIndex={-1}
        />
      </div>
          {!loaded && !error && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" data-testid="juguetes-loading" aria-busy="true">
              <p className="sr-only" role="status">{t('cargando')}</p>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="jug-skel" aria-hidden="true">
                  <div className="jug-skel-img" />
                  <div className="jug-skel-line w-3/4" />
                  <div className="jug-skel-line w-1/2" />
                </div>
              ))}
            </div>
          )}
          {loaded && visibleCatalog.length === 0 && (
            <div className="jug-empty" data-testid="juguetes-empty">
              <Star size={28} />
              <p className="font-semibold">{debouncedQuery ? t('vacioBusqueda') : t('vacio')}</p>
              {debouncedQuery && (
                <Button variant="outline" className="min-h-11" onClick={() => setQuery('')}>{t('limpiar')}</Button>
              )}
            </div>
          )}
          {visibleCatalog.length > 0 && ageFilter !== null && (
            <div data-testid="juguetes-grid" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {pageItems.map((item: any) => (
                <ToyCard key={item.id} {...cardProps(item)} />
              ))}
            </div>
          )}
          {visibleCatalog.length > 0 && ageFilter === null && (
            <div data-testid="juguetes-clusters" className="flex flex-col gap-4">
              {clusterByAge(pageItems).map((cluster) => (
                <section key={cluster.band} data-testid={`juguetes-cluster-${cluster.band}`} aria-labelledby={`band-${cluster.band}`}>
                  <h3 id={`band-${cluster.band}`} className="jug-band mb-3 mt-4">
                    <Star />
                    {t('edadEtiqueta')}: {t(`bandas.${cluster.band}`)}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {cluster.items.map((item: any) => (
                      <ToyCard key={item.id} {...cardProps(item)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          {visibleCatalog.length > 0 && (
            <p className="text-center text-sm text-muted-foreground" data-testid="juguetes-page-status" aria-live="polite">
              {t('paginaDe', { n: curPage, total: pages })}
            </p>
          )}
          <Pager page={curPage} pages={pages} onGo={goPage} t={pt} />
        </section>

        <aside id="cesta" aria-labelledby="juguetes-cesta-h" className="jug-basket" data-testid="juguetes-checkout-card">
          <h2 id="juguetes-cesta-h" className="text-xl font-semibold">{t('cesta')}</h2>
          <p className="text-sm text-muted-foreground" data-testid="juguetes-basket-count">
            {cartCount > 0 ? `${cartCount} ${t('articulos')}` : t('cestaVacia')}
          </p>
          <div className="flex flex-col gap-1">
            <label htmlFor="juguetes-household" className="text-sm font-medium">{t('hogarEtiqueta')}</label>
            <Input
              id="juguetes-household"
              data-testid="juguetes-household"
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
              aria-describedby="juguetes-household-help"
              className="h-11"
            />
            <p id="juguetes-household-help" className="text-xs text-muted-foreground">{t('hogarAyuda')}</p>
          </div>
          <Button data-testid="juguetes-checkout" onClick={checkout} className="min-h-11 w-full">{t('comprar')}</Button>
          <Button data-testid="juguetes-slots" variant="outline" onClick={loadSlots} className="min-h-11 w-full">{t('verTurnos')}</Button>
          {slots.length > 0 && (
            <Select value={slotId} onValueChange={setSlotId}>
              <SelectTrigger data-testid="juguetes-slot" className="h-11 w-full" aria-label={t('turno')}><SelectValue placeholder={t('turno')} /></SelectTrigger>
              <SelectContent>
                {slots.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.date} — {s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {slotId && <Button data-testid="juguetes-book" onClick={book} className="min-h-11 w-full">{t('reservar')}</Button>}
          {qrPng && (
            <figure className="flex flex-col items-center gap-2 rounded-lg bg-white p-3">
              <img src={qrPng} alt={t('qrAlt')} className="h-44 w-44" data-testid="juguetes-qr-img" />
              <figcaption className="text-center text-sm text-[#1b1d2a]">{t('qrListo')}</figcaption>
            </figure>
          )}
          {qr && <p data-testid="juguetes-qr" className="break-all text-xs text-muted-foreground">QR: {qr}</p>}
          {error && (
            <p role="alert" className="jug-error" data-testid="juguetes-error">{t('errorGenerico')} ({error})</p>
          )}
          {out && <p data-testid="juguetes-out" role="status" className="text-sm">{out}</p>}
        </aside>
      </main>

      <a href="#cesta" className="jug-bottombar lg:hidden" data-testid="juguetes-bottombar">
        <span>{t('cesta')} · {cartCount > 0 ? `${cartCount} ${t('articulos')}` : t('cestaVacia')}</span>
        <span className="font-semibold">{t('verCesta')} →</span>
      </a>

      <ChristmasFooter t={(k) => t(k)} />

      <Dialog open={zoom !== null} onOpenChange={(open) => { if (!open) setZoom(null); }}>
        <DialogContent data-testid="juguetes-modal" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{zoom?.alt ?? ''}</DialogTitle>
          </DialogHeader>
          {zoom && zoom.images.length > 0 && (
            <div className="flex flex-col gap-2">
              <img
                src={`${getApiBaseUrl()}${zoom.images[zoom.index]}`}
                alt={zoom.alt}
                className="max-h-[70vh] w-full object-contain"
                data-testid="juguetes-modal-img"
              />
              {zoom.desc && <p data-testid="juguetes-modal-desc">{zoom.desc}</p>}
              <div className="flex items-center justify-between">
                <Button
                  data-testid="juguetes-modal-prev"
                  disabled={zoom.images.length < 2}
                  onClick={() => setZoom({ ...zoom, index: (zoom.index - 1 + zoom.images.length) % zoom.images.length })}
                >
                  ←
                </Button>
                <span data-testid="juguetes-modal-count">{zoom.index + 1} / {zoom.images.length}</span>
                <Button
                  data-testid="juguetes-modal-next"
                  disabled={zoom.images.length < 2}
                  onClick={() => setZoom({ ...zoom, index: (zoom.index + 1) % zoom.images.length })}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
