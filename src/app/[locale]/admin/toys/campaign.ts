/**
 * Client-side campaign view for the toys admin (Altius redesign, step 1).
 * Everything here is derived from existing endpoints only — no invented fields.
 */
import { AGE_BANDS, type AgeBandKey } from '@/lib/toyBands';

export const PHASES = ['preparar', 'reservas', 'entrega', 'cierre'] as const;
export type Phase = (typeof PHASES)[number];
export type PhaseState = 'done' | 'now' | 'later';

export interface CampaignData {
  items: { quantity?: number; ageBand?: string }[] | null;
  children: { age?: number }[] | null;
  slots: { date?: string }[] | null;
  bookings: unknown[] | null;
  pending: { status?: string }[] | null;
  dispositions: { quantity?: number }[] | null;
}

/** Same bounds as the backend `bandForYears` (inclusive; 15+ → older). */
export function bandForYears(years: number): AgeBandKey | null {
  if (!Number.isInteger(years) || years < 0) return null;
  if (years < 1) return 'under_1';
  if (years <= 2) return 'y1_2';
  if (years <= 4) return 'y3_4';
  if (years <= 7) return 'y5_7';
  if (years <= 11) return 'y8_11';
  if (years <= 14) return 'y12_14';
  return 'older';
}

const len = (list: unknown[] | null) => list?.length ?? 0;
const sum = (list: { quantity?: number }[] | null) =>
  (list ?? []).reduce((acc, i) => acc + (Number.isFinite(i.quantity) ? Number(i.quantity) : 0), 0);

/** Earliest slot date (YYYY-MM-DD), or null when there are no slots. */
export function firstSlotDate(slots: CampaignData['slots']): string | null {
  const dates = (slots ?? []).map((s) => s.date ?? '').filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d)).sort();
  return dates[0]?.slice(0, 10) ?? null;
}

/**
 * Current phase, from evidence only:
 * any closure recorded → cierre; first pickup day reached → entrega;
 * toys and children registered → reservas; otherwise preparar.
 */
export function derivePhase(d: CampaignData, today: string): Phase {
  if (len(d.dispositions) > 0) return 'cierre';
  const first = firstSlotDate(d.slots);
  if (first && today >= first) return 'entrega';
  if (len(d.items) > 0 && len(d.children) > 0) return 'reservas';
  return 'preparar';
}

export function phaseState(phase: Phase, current: Phase): PhaseState {
  const a = PHASES.indexOf(phase);
  const b = PHASES.indexOf(current);
  return a < b ? 'done' : a === b ? 'now' : 'later';
}

export interface Totals {
  toyTypes: number | null;
  toyUnits: number | null;
  children: number | null;
  slots: number | null;
  bookings: number | null;
  toCollect: number | null;
  closedUnits: number | null;
}

export function totals(d: CampaignData): Totals {
  return {
    toyTypes: d.items ? d.items.length : null,
    toyUnits: d.items ? sum(d.items) : null,
    children: d.children ? d.children.length : null,
    slots: d.slots ? d.slots.length : null,
    bookings: d.bookings ? d.bookings.length : null,
    // Carts checked out (QR issued) but not yet collected.
    toCollect: d.pending ? d.pending.filter((c) => c.status === 'checked_out').length : null,
    closedUnits: d.dispositions ? sum(d.dispositions) : null,
  };
}

export interface AgeRow {
  band: AgeBandKey;
  toys: number;
  kids: number;
  diff: number;
}

/** Toy units vs registered children per age band (bands with neither are dropped). */
export function ageMatch(items: CampaignData['items'], children: CampaignData['children']): AgeRow[] {
  const toys = new Map<string, number>();
  for (const i of items ?? []) {
    if (!i.ageBand) continue;
    toys.set(i.ageBand, (toys.get(i.ageBand) ?? 0) + (Number(i.quantity) || 0));
  }
  const kids = new Map<string, number>();
  for (const c of children ?? []) {
    const band = typeof c.age === 'number' ? bandForYears(c.age) : null;
    if (band) kids.set(band, (kids.get(band) ?? 0) + 1);
  }
  return AGE_BANDS.map((band) => {
    const t = toys.get(band) ?? 0;
    const k = kids.get(band) ?? 0;
    return { band, toys: t, kids: k, diff: t - k };
  }).filter((r) => r.toys > 0 || r.kids > 0);
}

export type NextKey =
  | 'anadeJuguetes'
  | 'inscribeNinos'
  | 'anadeTurnos'
  | 'familiasReservan'
  | 'abreEscaner'
  | 'revisaCierre';

/** The one obvious next step for the current phase. */
export function nextAction(phase: Phase, d: CampaignData): { key: NextKey; href: string } {
  if (phase === 'preparar') {
    if (len(d.items) === 0) return { key: 'anadeJuguetes', href: '/admin/toys/stock' };
    return { key: 'inscribeNinos', href: '/admin/toys/consola#toys-children' };
  }
  if (phase === 'reservas') {
    if (len(d.slots) === 0) return { key: 'anadeTurnos', href: '/admin/toys/consola#toys-slots' };
    return { key: 'familiasReservan', href: '/juguetes' };
  }
  if (phase === 'entrega') return { key: 'abreEscaner', href: '/admin/toys/consola#toys-scan' };
  return { key: 'revisaCierre', href: '/admin/toys/consola#toys-close' };
}

/** Stock level for the chip colour: none, low (5 or fewer) or ok. */
export function stockLevel(quantity: number): 'out' | 'low' | 'ok' {
  if (quantity <= 0) return 'out';
  if (quantity <= 5) return 'low';
  return 'ok';
}
