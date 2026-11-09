'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/modules/comandero/money';
import type { FloorState, FloorTable, LineStatus } from '@/modules/comandero/types';

const LINE_VARIANT: Record<LineStatus, 'default' | 'secondary' | 'outline'> = {
  pedido: 'outline',
  en_preparacion: 'secondary',
  listo: 'default',
  servido: 'secondary',
};

function FloorTableCard({ entry }: { entry: FloorTable }) {
  const t = useTranslations('comandero.admin.session');
  const tStatus = useTranslations('comandero.status');
  const locale = useLocale();
  const { table, open_order, lines } = entry;

  return (
    <Card className="border-border" data-testid="comandero-floor-table">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          {table.label}
          {open_order ? (
            <Badge>{formatMoney(open_order.subtotal_cents, locale)}</Badge>
          ) : (
            <Badge variant="outline">{t('free')}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {lines.length === 0 ? <p className="text-xs text-muted-foreground">{t('noLines')}</p> : null}
        {lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between text-sm">
            <span className="truncate">
              {l.name}
              {l.note && <span className="text-muted-foreground"> · {l.note}</span>}
            </span>
            <Badge variant={LINE_VARIANT[l.status]}>{tStatus(l.status)}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** The live floor the teacher polls: one card per table, with its running total and lines. */
export function FloorGrid({ floor }: { floor: FloorState | null }) {
  const t = useTranslations('comandero.admin.session');
  const tables = floor?.tables ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="comandero-floor">
      {tables.map((entry) => (
        <FloorTableCard key={entry.table.id} entry={entry} />
      ))}
      {tables.length === 0 && <p className="text-sm text-muted-foreground">{t('noTables')}</p>}
    </div>
  );
}
