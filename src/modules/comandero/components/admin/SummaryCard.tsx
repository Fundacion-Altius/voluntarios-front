'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionSummary } from '@/modules/comandero/types';

const seconds = (ms: number): string => (ms / 1000).toFixed(1);

/** What the teacher sees after closing a service: waits, served items and average time per phase. */
export function SummaryCard({ summary }: { summary: SessionSummary }) {
  const t = useTranslations('comandero.admin.summary');
  const { avg_phase_ms: avg } = summary;

  return (
    <Card className="border-border bg-secondary" data-testid="comandero-session-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-secondary-foreground">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-secondary-foreground">
        <p>{t('waiting', { n: summary.waiting_lines })}</p>
        <p>{t('served', { n: summary.service_order.length })}</p>
        <p>
          {t('phases', {
            pedido: seconds(avg.pedido),
            preparacion: seconds(avg.en_preparacion),
            listo: seconds(avg.listo),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
