'use client';

import { useState } from 'react';
import { ChefHat, Wine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Station } from '@/modules/comandero/types';
import { useComanderoStation } from '@/modules/comandero/useComandero';

const STATION_LABEL: Record<Station, string> = { cocina: 'Cocina', barra: 'Barra' };
const NEXT_LABEL: Record<string, string> = {
  pedido: 'Empezar a preparar',
  en_preparacion: 'Marcar listo',
};
const STATUS_LABEL: Record<string, string> = {
  pedido: 'Pedido',
  en_preparacion: 'En preparación',
};

export function StationView({ sessionId, station }: { sessionId: string; station: Station }) {
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
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          Cola de {STATION_LABEL[station]}
          <Badge variant="secondary">{lines.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        {actionError && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{actionError}</p>}
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay comandas pendientes en {STATION_LABEL[station].toLowerCase()}.</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="truncate font-medium">{l.name}</span>
                  {l.note && <span className="block text-xs text-muted-foreground">{l.note}</span>}
                  <Badge variant="outline" className="mt-1">
                    {STATUS_LABEL[l.status] ?? l.status}
                  </Badge>
                </span>
                <Button size="sm" disabled={pending === l.id} onClick={() => void onAdvance(l.id)}>
                  {NEXT_LABEL[l.status] ?? 'Avanzar'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
