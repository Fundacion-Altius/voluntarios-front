'use client';

import { useState } from 'react';
import { Loader2, Plus, ReceiptText, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { comanderoApi } from '@/modules/comandero/api';
import type { OrderLine } from '@/modules/comandero/types';
import { useComanderoFloor, useComanderoSnapshot } from '@/modules/comandero/useComandero';

const LINE_LABEL: Record<string, string> = {
  pedido: 'Pedido',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  servido: 'Servido',
};
const LINE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  pedido: 'outline',
  en_preparacion: 'secondary',
  listo: 'default',
  servido: 'secondary',
};

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

export function WaiterView({ sessionId }: { sessionId: string }) {
  const { floor, loading, error, refresh } = useComanderoFloor(sessionId);
  const { snapshot } = useComanderoSnapshot(sessionId);

  const [selectedItem, setSelectedItem] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setActionError(null);
    setPending(key);
    const res = await fn();
    if (!res.success) setActionError(res.error ?? 'Error');
    await refresh();
    setPending(null);
  };

  if (loading && !floor) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando sala…
      </div>
    );
  }
  if (error) {
    return <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {actionError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(floor?.tables ?? []).map(({ table, open_order, lines }) => (
          <Card key={table.id} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Utensils className="size-4 text-primary" />
                  {table.label}
                </span>
                {open_order ? <Badge>{euros(open_order.subtotal_cents)}</Badge> : <Badge variant="outline">Libre</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!open_order ? (
                <Button
                  size="sm"
                  disabled={pending === table.id}
                  onClick={() => void run(table.id, () => comanderoApi.openOrder(table.id))}
                >
                  <Plus className="mr-1 size-4" />
                  Abrir comanda
                </Button>
              ) : (
                <>
                  <ul className="space-y-1">
                    {lines.map((l: OrderLine) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">
                          {l.name}
                          {l.note && <span className="text-muted-foreground"> · {l.note}</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant={LINE_VARIANT[l.status] ?? 'outline'}>{LINE_LABEL[l.status]}</Badge>
                          {l.status === 'listo' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending === l.id}
                              onClick={() => void run(l.id, () => comanderoApi.serveLine(l.id))}
                            >
                              Servir
                            </Button>
                          )}
                        </span>
                      </li>
                    ))}
                    {lines.length === 0 && <li className="text-xs text-muted-foreground">Sin líneas aún</li>}
                  </ul>

                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    <Select
                      value={selectedItem[open_order.id] ?? ''}
                      onValueChange={(v) => setSelectedItem((s) => ({ ...s, [open_order.id]: v }))}
                    >
                      <SelectTrigger aria-label="Elegir ítem de la carta">
                        <SelectValue placeholder="Añadir de la carta…" />
                      </SelectTrigger>
                      <SelectContent>
                        {snapshot.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} · {item.station} · {euros(item.price_cents)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={note[open_order.id] ?? ''}
                      onChange={(e) => setNote((s) => ({ ...s, [open_order.id]: e.target.value }))}
                      placeholder="Nota (p. ej. sin gluten)"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!selectedItem[open_order.id] || pending === open_order.id}
                        onClick={() =>
                          void run(open_order.id, async () => {
                            const r = await comanderoApi.addLine(open_order.id, {
                              snapshot_item_id: selectedItem[open_order.id],
                              note: note[open_order.id] || null,
                            });
                            if (r.success) {
                              setSelectedItem((s) => ({ ...s, [open_order.id]: '' }));
                              setNote((s) => ({ ...s, [open_order.id]: '' }));
                            }
                            return r;
                          })
                        }
                      >
                        <Plus className="mr-1 size-4" />
                        Añadir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending === `close-${open_order.id}`}
                        onClick={() => void run(`close-${open_order.id}`, () => comanderoApi.closeBill(open_order.id))}
                      >
                        <ReceiptText className="mr-1 size-4" />
                        Cerrar cuenta
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {(floor?.tables.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">El docente aún no ha añadido mesas a esta sesión.</p>
        )}
      </div>
    </div>
  );
}
