'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/modules/comandero/money';
import { floorTone, readyLines } from '@/modules/comandero/floorStatus';
import type { FloorState, FloorTable, LineStatus } from '@/modules/comandero/types';
import { cn } from '@/lib/utils';

const LINE_VARIANT: Record<LineStatus, 'default' | 'secondary' | 'outline'> = {
  pedido: 'outline',
  en_preparacion: 'secondary',
  listo: 'default',
  servido: 'secondary',
};

const TONE_CLASS: Record<ReturnType<typeof floorTone>, string> = {
  libre: 'border-dashed border-muted-foreground/40 bg-card',
  pedido: 'border-primary bg-primary/10',
  cocina: 'border-primary bg-[#ecebf8]',
  listo: 'border-[#a87b22] bg-gradient-to-br from-[#fff8e8] to-[#ffe8b8] shadow-[0_0_0_3px_rgba(168,123,34,0.18)]',
};

function statusHint(entry: FloorTable, t: ReturnType<typeof useTranslations>): string {
  const tone = floorTone(entry);
  if (tone === 'libre') return t('free');
  if (tone === 'listo') {
    const n = readyLines(entry.lines).length;
    return t('readyHint', { n });
  }
  if (tone === 'cocina') return t('inKitchen');
  return t('newOrders');
}

function FloorTableCard({ entry }: { entry: FloorTable }) {
  const t = useTranslations('comandero.admin.session');
  const tStatus = useTranslations('comandero.status');
  const locale = useLocale();
  const { table, open_order, lines } = entry;
  const tone = floorTone(entry);

  return (
    <div
      className={cn('flex min-h-[9.5rem] flex-col rounded-[1.25rem] border-2 p-4 shadow-sm', TONE_CLASS[tone])}
      data-testid="comandero-floor-table"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-xl font-bold text-foreground">{table.label}</p>
          <p
            className={cn(
              'mt-1 text-sm font-semibold',
              tone === 'listo' && 'text-[#a87b22]',
              tone === 'cocina' && 'text-primary',
              tone === 'pedido' && 'text-primary',
              tone === 'libre' && 'text-muted-foreground',
            )}
          >
            {statusHint(entry, t)}
          </p>
        </div>
        <span className="font-heading text-lg font-bold text-foreground">
          {open_order ? formatMoney(open_order.subtotal_cents, locale) : '—'}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {lines.length === 0 ? <p className="text-xs text-muted-foreground">{t('noLines')}</p> : null}
        {lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              {l.name}
              {l.note && <span className="text-muted-foreground"> · {l.note}</span>}
            </span>
            <Badge variant={LINE_VARIANT[l.status]}>{tStatus(l.status)}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The live floor the teacher polls: colour-coded tiles per mesa. */
export function FloorGrid({ floor }: { floor: FloorState | null }) {
  const t = useTranslations('comandero.admin.session');
  const tables = floor?.tables ?? [];
  const readyCount = tables.filter((e) => floorTone(e) === 'listo').length;

  return (
    <div className="space-y-3" data-testid="comandero-floor">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">{t('floorTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('floorSubtitle', { n: readyCount })}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((entry) => (
          <FloorTableCard key={entry.table.id} entry={entry} />
        ))}
        {tables.length === 0 && <p className="text-sm text-muted-foreground">{t('noTables')}</p>}
      </div>
    </div>
  );
}
