'use client';

import { useState } from 'react';
import { ChefHat, Wine } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LineStatus, Station } from '@/modules/comandero/types';
import { useComanderoStation } from '@/modules/comandero/useComandero';

/** The next action a station can take on a line; anything else falls back to a plain "advance". */
function nextActionKey(status: LineStatus): string {
  return status === 'pedido' || status === 'en_preparacion' ? `next.${status}` : 'advance';
}

export function StationView({ sessionId, station }: { sessionId: string; station: Station }) {
  const t = useTranslations('comandero.portal');
  const tStatus = useTranslations('comandero.status');
  const locale = useLocale();
  const stationName = t(`role.${station}`);
  const { lines, error, advance } = useComanderoStation(sessionId, station);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const onAdvance = async (lineId: string) => {
    setActionError(null);
    setPending(lineId);
    const err = await advance(lineId);
    if (err) setActionError(err);
    setPending(null);
  };

  const Icon = station === 'barra' ? Wine : ChefHat;

  return (
    <Card className="border-border" data-testid={`comandero-station-${station}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {t('station.title', { station: stationName })}
          <Badge variant="secondary" data-testid="comandero-station-count">{lines.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        {actionError && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{actionError}</p>}
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('station.empty', { station: stationName.toLocaleLowerCase(locale) })}
          </p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li
                key={l.id}
                data-testid="comandero-station-line"
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="truncate font-medium">{l.name}</span>
                  {l.note && <span className="block text-xs text-muted-foreground">{l.note}</span>}
                  <Badge variant="outline" className="mt-1">
                    {tStatus(l.status)}
                  </Badge>
                </span>
                <Button
                  size="sm"
                  data-testid="comandero-advance-line"
                  disabled={pending === l.id}
                  onClick={() => void onAdvance(l.id)}
                >
                  {t(`station.${nextActionKey(l.status)}`)}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
