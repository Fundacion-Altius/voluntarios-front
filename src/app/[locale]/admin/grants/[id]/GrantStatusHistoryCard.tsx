'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { STATUS_COLORS, STATUS_LABELS, type GrantStatus, type GrantStatusHistoryEntry } from '@/types/grant';

interface GrantStatusHistoryCardProps {
  history: GrantStatusHistoryEntry[];
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function GrantStatusHistoryCard({ history }: GrantStatusHistoryCardProps) {
  const t = useTranslations('admin.grantDetail');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('statusHistory')}</CardTitle>
        <CardDescription>{t('statusHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <Alert>
            <AlertDescription>{t('noStatusHistory')}</AlertDescription>
          </Alert>
        ) : (
          <ol className="relative space-y-4 border-l pl-6" aria-label={t('statusHistory')}>
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.85rem] top-1.5 size-3 rounded-full border-2 border-background bg-primary" />
                <div className="flex flex-wrap items-center gap-2">
                  {entry.from_status && (
                    <>
                      <Badge className={STATUS_COLORS[entry.from_status as GrantStatus]}>
                        {STATUS_LABELS[entry.from_status as GrantStatus] ?? entry.from_status}
                      </Badge>
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                  <Badge className={STATUS_COLORS[entry.to_status as GrantStatus]}>
                    {STATUS_LABELS[entry.to_status as GrantStatus] ?? entry.to_status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(entry.changed_at)}
                  {entry.changed_by ? ` · ${entry.changed_by}` : ''}
                </p>
                {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
