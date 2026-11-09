/** Turnos (step 2): week maths and capacity, pure helpers. Dates are YYYY-MM-DD strings. */
export interface Slot {
  id: string;
  date: string;
  label: string;
  start_time?: string | null;
  end_time?: string | null;
  capacity?: number | null;
}

export interface Booking {
  slot_id: string;
  household_id: string;
}

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

/** Monday of the week that contains `iso`. */
export function weekStart(iso: string): string {
  const d = toDate(iso);
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return toIso(d);
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** The week to open first: the next week with slots from today, else the first week with slots, else this week. */
export function initialWeek(slots: Slot[], today: string): string {
  const dates = slots.map((s) => s.date).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const upcoming = dates.find((d) => d >= today);
  return weekStart(upcoming ?? dates[0] ?? today);
}

export function bookedCount(slotId: string, bookings: Booking[]): number {
  return bookings.filter((b) => b.slot_id === slotId).length;
}

export type Fill = 'free' | 'full' | 'open';

/** full = no places left, free = has a capacity with places, open = no limit set. */
export function slotFill(slot: Slot, booked: number): Fill {
  if (typeof slot.capacity !== 'number') return 'open';
  return booked >= slot.capacity ? 'full' : 'free';
}

export function sortSlots(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => (a.date + (a.start_time ?? '')).localeCompare(b.date + (b.start_time ?? '')));
}

export interface Places {
  booked: number;
  capacity: number;
}

/** Places across slots that have a capacity (slots without a limit are left out). */
export function placesTotal(slots: Slot[], bookings: Booking[]): Places {
  return slots.reduce(
    (acc, s) =>
      typeof s.capacity === 'number'
        ? { booked: acc.booked + Math.min(bookedCount(s.id, bookings), s.capacity), capacity: acc.capacity + s.capacity }
        : acc,
    { booked: 0, capacity: 0 },
  );
}
