'use client';

import { useState } from 'react';
import { ChefHat, Loader2, Plus, RefreshCw, Trash2, Wine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { comanderoApi } from '@/modules/comandero/api';
import type { ItemCategory, SessionSummary } from '@/modules/comandero/types';
import { useComanderoFloor, useComanderoMenu } from '@/modules/comandero/useComandero';

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

export default function ComanderoAdminPage() {
  const { menu, loading, error, addItem, removeItem } = useComanderoMenu();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('plato');
  const [price, setPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const { floor, refresh: refreshFloor } = useComanderoFloor(sessionId);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const err = await addItem({
      name,
      category,
      price_cents: Math.round((Number(price) || 0) * 100),
    });
    if (err) {
      setFormError(err);
      return;
    }
    setName('');
    setPrice('');
  };

  const startSession = async () => {
    if (!sessionLabel.trim()) return;
    setBusy(true);
    const res = await comanderoApi.startSession({ label: sessionLabel.trim() });
    setBusy(false);
    if (res.success) {
      setSessionId(res.data.id);
      setSummary(null);
    }
  };

  const addTable = async () => {
    if (!sessionId || !tableLabel.trim()) return;
    await comanderoApi.addTable(sessionId, tableLabel.trim());
    setTableLabel('');
    await refreshFloor();
  };

  const closeSession = async () => {
    if (!sessionId) return;
    setBusy(true);
    const res = await comanderoApi.closeSession(sessionId, {});
    setBusy(false);
    if (res.success) {
      setSummary(res.data);
      setSessionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Comandero</h1>
        <p className="text-sm text-muted-foreground">
          Simulación de servicio de restaurante para el aula de Servicios de Restaurante. No es un
          TPV: el cobro es simulado.
        </p>
      </div>

      {/* Carta del aula */}
      <Card>
        <CardHeader>
          <CardTitle>Carta del aula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddItem} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="item-name">Nombre</Label>
              <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="item-category">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                <SelectTrigger id="item-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plato">Plato (cocina)</SelectItem>
                  <SelectItem value="bebida">Bebida (barra)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-28">
              <Label htmlFor="item-price">Precio (€)</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Plus className="mr-1 size-4" />
              Añadir
            </Button>
          </form>
          {formError && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{formError}</p>}
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando carta…
            </div>
          ) : menu.length === 0 ? (
            <p className="text-sm text-muted-foreground">La carta del aula está vacía. Añade platos y bebidas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem</TableHead>
                  <TableHead>Estación</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {menu.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {item.category === 'bebida' ? <Wine className="size-3" /> : <ChefHat className="size-3" />}
                        {item.category === 'bebida' ? 'Barra' : 'Cocina'}
                      </Badge>
                    </TableCell>
                    <TableCell>{euros(item.price_cents)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${item.name}`}
                        onClick={() => void removeItem(item.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sesión de práctica */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sesión de práctica</CardTitle>
          {sessionId && (
            <Button variant="outline" size="icon" aria-label="Actualizar sala" onClick={() => void refreshFloor()}>
              <RefreshCw className="size-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionId ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="session-label">Nombre de la sesión</Label>
                <Input
                  id="session-label"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  placeholder="Servicio mediodía 12-nov"
                />
              </div>
              <Button onClick={() => void startSession()} disabled={busy || !sessionLabel.trim()}>
                {busy ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Plus className="mr-1 size-4" />}
                Arrancar sesión
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="table-label">Añadir mesa</Label>
                  <Input
                    id="table-label"
                    value={tableLabel}
                    onChange={(e) => setTableLabel(e.target.value)}
                    placeholder="Mesa 1"
                  />
                </div>
                <Button variant="outline" onClick={() => void addTable()} disabled={!tableLabel.trim()}>
                  <Plus className="mr-1 size-4" />
                  Mesa
                </Button>
                <Button className="bg-cta text-cta-foreground hover:bg-cta-hover" onClick={() => void closeSession()} disabled={busy}>
                  Cerrar sesión y ver resumen
                </Button>
              </div>

              {/* Vista de sala por polling */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(floor?.tables ?? []).map(({ table, open_order, lines }) => (
                  <Card key={table.id} className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        {table.label}
                        {open_order ? (
                          <Badge>{euros(open_order.subtotal_cents)}</Badge>
                        ) : (
                          <Badge variant="outline">Libre</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {lines.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin líneas</p>
                      ) : (
                        lines.map((l) => (
                          <div key={l.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">
                              {l.name}
                              {l.note && <span className="text-muted-foreground"> · {l.note}</span>}
                            </span>
                            <Badge variant={LINE_VARIANT[l.status] ?? 'outline'}>{LINE_LABEL[l.status]}</Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))}
                {(floor?.tables.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">Añade mesas para empezar el servicio.</p>
                )}
              </div>
            </>
          )}

          {summary && (
            <Card className="border-border bg-secondary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-secondary-foreground">Resumen de la sesión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-secondary-foreground">
                <p>Líneas en espera al cerrar: {summary.waiting_lines}</p>
                <p>Ítems servidos: {summary.service_order.length}</p>
                <p>
                  Tiempo medio por fase (s): pedido {(summary.avg_phase_ms.pedido / 1000).toFixed(1)} · preparación{' '}
                  {(summary.avg_phase_ms.en_preparacion / 1000).toFixed(1)} · listo{' '}
                  {(summary.avg_phase_ms.listo / 1000).toFixed(1)}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
