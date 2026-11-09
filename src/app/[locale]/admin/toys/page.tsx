'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, Check, Flag, Gift, ScanLine, Users } from 'lucide-react';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useToys } from './useToys';
import { ToysHeader } from './_components/ToysHeader';
import {
  PHASES,
  ageMatch,
  derivePhase,
  firstSlotDate,
  nextAction,
  phaseState,
  totals,
  type CampaignData,
  type Phase,
} from './campaign';

const NEXT_ICON = { anadeJuguetes: Gift, inscribeNinos: Users, anadeTurnos: CalendarDays, familiasReservan: Users, abreEscaner: ScanLine, revisaCierre: Flag } as const;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Num({ value, testid }: { value: number | null; testid?: string }) {
  return (
    <span data-testid={testid} className="font-heading text-xl font-bold tabular-nums">
      {value ?? '—'}
    </span>
  );
}

export default function ToysOverviewPage() {
  const t = useTranslations('admin.toys');
  const locale = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [data, setData] = useState<CampaignData | null>(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (requested || !api.status?.enabled) return;
    setRequested(true);
    const pick = <T,>(r: { success: boolean; data?: unknown }) => (r.success && Array.isArray(r.data) ? (r.data as T[]) : null);
    void Promise.all([api.listItems(), api.listChildren(), api.listSlots(), api.listBookings(), api.pending(), api.listDispositions()]).then(
      ([items, children, slots, bookings, pending, dispositions]) =>
        setData({
          items: pick(items),
          children: pick(children),
          slots: pick(slots),
          bookings: pick(bookings),
          pending: pick(pending),
          dispositions: pick(dispositions),
        }),
    );
  }, [api, requested]);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t('loginRequerido')}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t('apagado')}</p>;

  const year = new Date().getFullYear();
  const first = data ? firstSlotDate(data.slots) : null;
  const firstLabel = first
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(`${first}T12:00:00`))
    : null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8" data-testid="toys-overview">
      <ToysHeader
        active="resumen"
        title={t('campana.titulo', { year })}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span data-testid="toys-status" className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-sm font-semibold text-success">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              {t('campana.activa')}
            </span>
            <span>{firstLabel ? t('campana.primerTurno', { date: firstLabel }) : t('campana.sinTurnos')}</span>
          </span>
        }
      />
      {!data ? <Skeleton className="h-64 w-full" /> : <Overview data={data} />}
    </div>
  );
}

function Overview({ data }: { data: CampaignData }) {
  const t = useTranslations('admin.toys');
  const phase = derivePhase(data, todayIso());
  const n = totals(data);
  const next = nextAction(phase, data);
  const NextIcon = NEXT_ICON[next.key];
  const rows = ageMatch(data.items, data.children);
  const max = Math.max(1, ...rows.flatMap((r) => [r.toys, r.kids]));

  const numbers: Record<Phase, { label: string; value: number | null; testid: string }[]> = {
    preparar: [
      { label: t('campana.n.juguetes'), value: n.toyUnits, testid: 'toys-n-units' },
      { label: t('campana.n.ninos'), value: n.children, testid: 'toys-n-children' },
    ],
    reservas: [
      { label: t('campana.n.turnos'), value: n.slots, testid: 'toys-n-slots' },
      { label: t('campana.n.reservas'), value: n.bookings, testid: 'toys-n-bookings' },
    ],
    entrega: [{ label: t('campana.n.porRecoger'), value: n.toCollect, testid: 'toys-n-tocollect' }],
    cierre: [{ label: t('campana.n.cerrados'), value: n.closedUnits, testid: 'toys-n-closed' }],
  };

  return (
    <>
      <section
        aria-labelledby="toys-next-title"
        data-testid="toys-next"
        className="flex flex-col gap-4 rounded-2xl bg-[#2a2c7a] p-5 text-white sm:flex-row sm:items-center sm:gap-6 sm:p-7 dark:bg-[#23254a]"
      >
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:flex" aria-hidden="true">
          <NextIcon className="size-7 text-cta" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-cta">{t('campana.loSiguiente')}</p>
          <h2 id="toys-next-title" className="font-heading text-2xl font-bold">{t(`campana.next.${next.key}.titulo`)}</h2>
          <p className="mt-1 text-[#d9daf2]">{t(`campana.next.${next.key}.texto`)}</p>
        </div>
        <Button asChild variant="cta" className="h-12 px-6 text-base">
          <Link href={next.href} data-testid="toys-next-action">
            {t(`campana.next.${next.key}.boton`)}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <ol aria-label={t('campana.fases')} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
        {PHASES.map((p, i) => {
          const state = phaseState(p, phase);
          return (
            <li key={p} data-testid={`toys-phase-${p}`} data-state={state} aria-current={state === 'now' ? 'step' : undefined} className="flex gap-3 md:flex-col md:gap-3">
              <div className="flex items-center md:w-full">
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full border-2 font-heading text-lg font-bold',
                    state === 'done' && 'border-success bg-success text-success-foreground',
                    state === 'now' && 'border-primary bg-primary text-primary-foreground ring-[6px] ring-accent',
                    state === 'later' && 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {state === 'done' ? <Check className="size-5" aria-hidden="true" /> : i + 1}
                </span>
                {i < PHASES.length - 1 && (
                  <span aria-hidden="true" className={cn('ml-3 hidden h-1 flex-1 rounded-full md:block', state === 'done' ? 'bg-success' : 'bg-border')} />
                )}
              </div>
              <div
                className={cn(
                  'flex-1 rounded-xl border bg-card p-4 shadow-xs',
                  state === 'now' && 'border-2 border-primary',
                  state === 'later' && 'bg-muted/40 shadow-none',
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('campana.fase', { n: i + 1 })}</span>
                  {state !== 'later' && (
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', state === 'done' ? 'bg-success/10 text-success' : 'bg-accent text-primary')}>
                      {t(`campana.estado.${state}`)}
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-lg font-semibold">{t(`campana.fasesNombre.${p}.titulo`)}</h3>
                <p className="mb-3 text-sm text-muted-foreground">{t(`campana.fasesNombre.${p}.sub`)}</p>
                <dl className="flex flex-col gap-1.5">
                  {numbers[p].map((row) => (
                    <div key={row.testid} className="flex items-baseline justify-between gap-2 text-sm">
                      <dt>{row.label}</dt>
                      <dd><Num value={row.value} testid={row.testid} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="toys-age-title" data-testid="toys-age-match" className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="toys-age-title" className="font-heading text-xl font-bold">{t('campana.edad.titulo')}</h2>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-primary" aria-hidden="true" />{t('campana.edad.juguetes')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-[#a9abe0]" aria-hidden="true" />{t('campana.edad.ninos')}</span>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="text-muted-foreground" data-testid="toys-age-empty">{t('campana.edad.vacio')}</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.band} data-testid={`toys-age-${r.band}`} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 py-2.5 text-sm sm:grid-cols-[7rem_1fr_auto]">
                  <span className="font-semibold">{t(`bandas.${r.band}`)}</span>
                  <span className="flex flex-col gap-1" aria-label={t('campana.edad.aria', { toys: r.toys, kids: r.kids })}>
                    <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(r.toys / max) * 100}%` }} /></span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-[#a9abe0]" style={{ width: `${(r.kids / max) * 100}%` }} /></span>
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      r.kids === 0 ? 'bg-muted text-muted-foreground' : r.diff < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
                    )}
                  >
                    {r.kids === 0 ? t('campana.edad.sinNinos') : r.diff < 0 ? t('campana.edad.faltan', { n: -r.diff }) : r.diff === 0 ? t('campana.edad.justo') : t('campana.edad.sobran', { n: r.diff })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="toys-tools-title" className="rounded-xl border bg-card p-5 shadow-xs">
          <h2 id="toys-tools-title" className="mb-1 font-heading text-xl font-bold">{t('campana.herramientas.titulo')}</h2>
          <p className="mb-3 text-sm text-muted-foreground">{t('campana.herramientas.texto')}</p>
          <ul className="divide-y">
            {(
              [
                ['inventario', '/admin/toys/stock', Gift],
                ['ninos', '/admin/toys/consola#toys-children', Users],
                ['turnos', '/admin/toys/consola#toys-slots', CalendarDays],
                ['entrega', '/admin/toys/consola#toys-scan', ScanLine],
                ['cierre', '/admin/toys/consola#toys-close', Flag],
              ] as const
            ).map(([key, href, Icon]) => (
              <li key={key}>
                <Link
                  href={href}
                  data-testid={`toys-tool-${key}`}
                  className="flex min-h-12 items-center gap-3 rounded-md py-2 outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary" aria-hidden="true"><Icon className="size-4" /></span>
                  <span className="flex-1 font-medium">{t(`campana.herramientas.${key}`)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
