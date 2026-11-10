import { dominantLineStatus, floorTone, formatWaitClock, waitIsLate, waitSeconds } from './floorStatus';
import type { FloorTable, OrderLine } from './types';

const line = (status: OrderLine['status'], extra: Partial<OrderLine> = {}): OrderLine => ({
  id: 'l1',
  order_id: 'o1',
  snapshot_item_id: 's1',
  name: 'Croquetas',
  station: 'cocina',
  price_cents: 600,
  status,
  note: null,
  ordered_at: '2026-11-09T12:00:00.000Z',
  preparing_at: null,
  ready_at: null,
  served_at: null,
  ...extra,
});

const table = (lines: OrderLine[], open = true): FloorTable => ({
  table: { id: 't1', session_id: 's1', label: 'Mesa 1' },
  open_order: open ? { id: 'o1', session_id: 's1', table_id: 't1', status: 'abierta', subtotal_cents: 600 } : null,
  lines,
});

describe('floorStatus', () => {
  it('picks listo over cocina and pedido', () => {
    expect(dominantLineStatus([line('pedido'), line('en_preparacion'), line('listo')])).toBe('listo');
    expect(floorTone(table([line('pedido'), line('listo')]))).toBe('listo');
    expect(floorTone(table([line('en_preparacion')]))).toBe('cocina');
    expect(floorTone(table([], false))).toBe('libre');
  });

  it('formats wait clocks and flags late tickets', () => {
    expect(formatWaitClock(125)).toBe('02:05');
    expect(waitIsLate(599)).toBe(false);
    expect(waitIsLate(600)).toBe(true);
    const ordered = line('pedido', { ordered_at: new Date(Date.now() - 90_000).toISOString() });
    expect(waitSeconds(ordered)).toBeGreaterThanOrEqual(89);
  });
});
