/** Modo reparto (step 2): shapes returned by POST /scan/lookup and /scan/confirm. */
export interface HandoverLine {
  toy_id: string;
  qty: number;
  title: string;
  ageBand: string | null;
  cover: string | null;
  in_stock: boolean;
}

export interface Handover {
  token: string;
  cart_id: string;
  household: string;
  toy_quota: number | null;
  status: 'pending' | 'delivered';
  delivered_at: string | null;
  problem_note: string | null;
  slot: { id: string; date: string; label: string; start_time: string | null; end_time: string | null } | null;
  lines: HandoverLine[];
  can_deliver: boolean;
}

export type ScanError = 'not_found' | 'already_delivered' | 'empty' | 'other';

/** Maps an API failure to a friendly message key. */
export function scanErrorKey(r: { code?: string; status?: number }): ScanError {
  if (r.code === 'not_found' || r.status === 404) return 'not_found';
  if (r.code === 'already_delivered' || r.status === 409) return 'already_delivered';
  return 'other';
}

/** "10:00–12:00" when the slot has times, else its label. */
export function slotTime(slot: Handover['slot']): string {
  if (!slot) return '';
  if (slot.start_time && slot.end_time) return `${slot.start_time}–${slot.end_time}`;
  return slot.label;
}

export function toyCount(lines: HandoverLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}
