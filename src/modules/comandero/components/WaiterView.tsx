'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { comanderoApi } from '@/modules/comandero/api';
import { floorTone, readyLines, unservedLines } from '@/modules/comandero/floorStatus';
import { formatMoney } from '@/modules/comandero/money';
import type { FloorTable, OrderLine, SessionMenuItem } from '@/modules/comandero/types';
import { useComanderoFloor, useComanderoSnapshot } from '@/modules/comandero/useComandero';
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  libre: 'border-dashed border-muted-foreground/40 bg-card',
  pedido: 'border-primary bg-primary/10',
  cocina: 'border-primary bg-[#ecebf8]',
  listo: 'border-[#a87b22] bg-gradient-to-br from-[#fff8e8] to-[#ffe8b8] shadow-[0_0_0_3px_rgba(168,123,34,0.2)]',
} as const;

const STATUS_PILL: Record<string, string> = {
  pedido: 'bg-[#e8eefc] text-primary',
  en_preparacion: 'bg-[#efe8ff] text-[#5b3aa8]',
  listo: 'bg-[#fff1cc] text-[#a87b22]',
  servido: 'bg-emerald-100 text-emerald-800',
};

function tableHint(entry: FloorTable, t: ReturnType<typeof useTranslations>, tStatus: ReturnType<typeof useTranslations>): string {
  const tone = floorTone(entry);
  if (tone === 'libre') return t('waiter.free');
  if (tone === 'listo') {
    const ready = readyLines(entry.lines);
    if (ready.length === 1) return t('waiter.readyOne', { name: ready[0].name });
    return t('waiter.readyMany', { n: ready.length });
  }
  if (tone === 'cocina') return t('waiter.inKitchen');
  const first = entry.lines.find((l) => l.status !== 'servido');
  return first ? tStatus(first.status) : t('waiter.open');
}

export function WaiterView({ sessionId }: { sessionId: string }) {
  const locale = useLocale();
  const t = useTranslations('comandero.portal');
  const tStatus = useTranslations('comandero.status');
  const euros = (cents: number) => formatMoney(cents, locale);
  const { floor, loading, error, refresh } = useComanderoFloor(sessionId);
  const { snapshot } = useComanderoSnapshot(sessionId);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [menuTab, setMenuTab] = useState<'plato' | 'bebida'>('plato');
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const selected = floor?.tables.find((e) => e.table.id === selectedTableId) ?? null;

  const run = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setActionError(null);
    setPending(key);
    const res = await fn();
    if (!res.success) setActionError(res.error ?? t('waiter.error'));
    await refresh();
    setPending(null);
    return res;
  };

  const openTable = async (entry: FloorTable) => {
    if (!entry.open_order) {
      const res = await run(entry.table.id, () => comanderoApi.openOrder(entry.table.id));
      if (!res.success) return;
    }
    setSelectedTableId(entry.table.id);
    setNote('');
  };

  if (loading && !floor) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {t('waiter.loading')}
      </div>
    );
  }
  if (error) {
    return <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>;
  }

  const ready = selected ? readyLines(selected.lines) : [];
  const nextServe = ready[0] ?? null;
  const canClose = selected?.open_order ? unservedLines(selected.lines).length === 0 && selected.lines.length > 0 : false;
  const platos = snapshot.filter((i) => i.category === 'plato');
  const bebidas = snapshot.filter((i) => i.category === 'bebida');

  return (
    <div className="space-y-4">
      {actionError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="comandero-waiter-floor">
        {(floor?.tables ?? []).map((entry) => {
          const tone = floorTone(entry);
          return (
            <div
              key={entry.table.id}
              data-testid="comandero-waiter-table"
              className={cn('flex min-h-[8.25rem] flex-col rounded-[1.125rem] border-2 p-3.5 text-left shadow-sm', TONE_CLASS[tone])}
            >
              <button
                type="button"
                className="flex flex-1 flex-col text-left"
                onClick={() => void openTable(entry)}
                data-testid={entry.open_order ? 'comandero-waiter-open-sheet' : undefined}
              >
                <span className="font-heading text-xl font-bold text-foreground">{entry.table.label}</span>
                <span
                  className={cn(
                    'mt-1 text-xs font-semibold',
                    tone === 'listo' && 'text-[#a87b22]',
                    (tone === 'cocina' || tone === 'pedido') && 'text-primary',
                    tone === 'libre' && 'text-muted-foreground',
                  )}
                >
                  {tableHint(entry, t, tStatus)}
                </span>
                <span className="mt-auto pt-3 font-heading text-xl font-bold text-foreground">
                  {entry.open_order ? euros(entry.open_order.subtotal_cents) : '—'}
                </span>
              </button>
              {!entry.open_order && (
                <Button
                  size="sm"
                  className="mt-2 min-h-11"
                  data-testid="comandero-open-order"
                  disabled={pending === entry.table.id}
                  onClick={() => void openTable(entry)}
                >
                  <Plus className="mr-1 size-4" />
                  {t('waiter.openOrder')}
                </Button>
              )}
            </div>
          );
        })}
        {(floor?.tables.length ?? 0) === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">{t('waiter.noTables')}</p>
        )}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedTableId(null)}>
        <SheetContent side="bottom" className="max-h-[94vh] overflow-y-auto rounded-t-3xl p-4 sm:max-w-lg sm:rounded-t-3xl">
          {selected?.open_order && (
            <TableSheet
              entry={selected}
              note={note}
              setNote={setNote}
              menuTab={menuTab}
              setMenuTab={setMenuTab}
              platos={platos}
              bebidas={bebidas}
              nextServe={nextServe}
              canClose={canClose}
              pending={pending}
              euros={euros}
              t={t}
              tStatus={tStatus}
              onServe={(line) => void run(line.id, () => comanderoApi.serveLine(line.id))}
              onAdd={async (item) => {
                const orderId = selected.open_order!.id;
                await run(orderId, async () => {
                  const r = await comanderoApi.addLine(orderId, {
                    snapshot_item_id: item.id,
                    note: note || null,
                  });
                  if (r.success) setNote('');
                  return r;
                });
              }}
              onCloseBill={() =>
                void run(`close-${selected.open_order!.id}`, () => comanderoApi.closeBill(selected.open_order!.id)).then(
                  (r) => {
                    if (r.success) setSelectedTableId(null);
                  },
                )
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TableSheet({
  entry,
  note,
  setNote,
  menuTab,
  setMenuTab,
  platos,
  bebidas,
  nextServe,
  canClose,
  pending,
  euros,
  t,
  tStatus,
  onServe,
  onAdd,
  onCloseBill,
}: {
  entry: FloorTable;
  note: string;
  setNote: (v: string) => void;
  menuTab: 'plato' | 'bebida';
  setMenuTab: (v: 'plato' | 'bebida') => void;
  platos: SessionMenuItem[];
  bebidas: SessionMenuItem[];
  nextServe: OrderLine | null;
  canClose: boolean;
  pending: string | null;
  euros: (cents: number) => string;
  t: ReturnType<typeof useTranslations>;
  tStatus: ReturnType<typeof useTranslations>;
  onServe: (line: OrderLine) => void;
  onAdd: (item: SessionMenuItem) => void;
  onCloseBill: () => void;
}) {
  const items = menuTab === 'plato' ? platos : bebidas;
  const order = entry.open_order!;

  return (
    <div className="space-y-4 pb-6" data-testid="comandero-waiter-sheet">
      <div className="mx-auto h-1.5 w-11 rounded-full bg-border" aria-hidden />
      <SheetHeader className="space-y-1 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('waiter.sheetEyebrow')}</p>
            <SheetTitle className="font-heading text-2xl">{entry.table.label}</SheetTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('waiter.total')}</p>
            <p className="font-heading text-2xl font-bold text-[#a87b22]">{euros(order.subtotal_cents)}</p>
          </div>
        </div>
      </SheetHeader>

      <ul className="grid gap-2">
        {entry.lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-semibold">{l.name}</span>
              {l.note && <span className="text-muted-foreground"> · {l.note}</span>}
              <span className="ml-2 text-muted-foreground">{euros(l.price_cents)}</span>
            </span>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_PILL[l.status])}>
              {l.status === 'en_preparacion' ? t('waiter.prepShort') : tStatus(l.status)}
            </span>
          </li>
        ))}
        {entry.lines.length === 0 && <li className="text-sm text-muted-foreground">{t('waiter.noLines')}</li>}
      </ul>

      {nextServe && (
        <Button
          className="min-h-14 w-full rounded-xl bg-[#e2bd7a] text-[#1a1408] hover:bg-[#d4ad68]"
          data-testid="comandero-serve-line"
          disabled={pending === nextServe.id}
          onClick={() => onServe(nextServe)}
        >
          {t('waiter.serveNamed', { name: nextServe.name })}
        </Button>
      )}

      <Tabs value={menuTab} onValueChange={(v) => setMenuTab(v as 'plato' | 'bebida')}>
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger value="plato" className="min-h-11 rounded-lg data-[state=active]:bg-card">
            {t('waiter.dishes')}
          </TabsTrigger>
          <TabsTrigger value="bebida" className="min-h-11 rounded-lg data-[state=active]:bg-card">
            {t('waiter.drinks')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={menuTab} className="mt-3">
          <div className="grid grid-cols-2 gap-2" data-testid="comandero-item-select">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid="comandero-menu-tile"
                className="flex min-h-16 flex-col rounded-xl border border-border bg-card p-2.5 text-left"
                disabled={pending === order.id}
                onClick={() => onAdd(item)}
              >
                <strong className="font-heading text-sm">{item.name}</strong>
                <span className="text-xs text-muted-foreground">{t(`role.${item.station}`)}</span>
                <span className="mt-auto text-sm font-bold text-[#a87b22]">{euros(item.price_cents)}</span>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Input
        data-testid="comandero-line-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('waiter.notePlaceholder')}
        className="min-h-11"
      />

      <Button
        variant="secondary"
        className="min-h-12 w-full rounded-xl"
        data-testid="comandero-close-bill"
        disabled={!canClose || pending === `close-${order.id}`}
        onClick={onCloseBill}
      >
        {canClose ? t('waiter.closeBill') : t('waiter.closeBlocked')}
      </Button>
    </div>
  );
}
