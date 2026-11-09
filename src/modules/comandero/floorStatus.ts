import type { FloorTable, LineStatus, OrderLine } from './types';

/** Visual bucket for a mesa tile on the sala / camarero floor. */
export type FloorTone = 'libre' | 'pedido' | 'cocina' | 'listo';

const RANK: Record<LineStatus, number> = {
  servido: 0,
  pedido: 1,
  en_preparacion: 2,
  listo: 3,
};

/** Highest-priority open line status drives the tile colour (listo wins). */
export function dominantLineStatus(lines: OrderLine[]): LineStatus | null {
  let best: LineStatus | null = null;
  for (const line of lines) {
    if (line.status === 'servido') continue;
    if (!best || RANK[line.status] > RANK[best]) best = line.status;
  }
  return best;
}

export function floorTone(entry: FloorTable): FloorTone {
  if (!entry.open_order) return 'libre';
  const dominant = dominantLineStatus(entry.lines);
  if (dominant === 'listo') return 'listo';
  if (dominant === 'en_preparacion') return 'cocina';
  if (dominant === 'pedido') return 'pedido';
  return 'pedido';
}

export function readyLines(lines: OrderLine[]): OrderLine[] {
  return lines.filter((l) => l.status === 'listo');
}

export function unservedLines(lines: OrderLine[]): OrderLine[] {
  return lines.filter((l) => l.status !== 'servido');
}

/** Wait seconds from the most relevant timestamp for a station ticket. */
export function waitSeconds(line: OrderLine, nowMs = Date.now()): number {
  const start = line.preparing_at ?? line.ordered_at;
  const ms = nowMs - new Date(start).getTime();
  return Math.max(0, Math.floor(ms / 1000));
}

export function formatWaitClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function waitIsLate(totalSeconds: number): boolean {
  return totalSeconds >= 10 * 60;
}
