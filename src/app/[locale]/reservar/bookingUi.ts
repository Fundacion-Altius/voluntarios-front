import { es } from 'react-day-picker/locale';

export type BookingSlot = { startUtc: string; endUtc: string };

/** YYYY-MM-DD in the visitor's timezone (en-CA → ISO-like). */
export function dayKeyInTz(isoOrDate: string | Date, timeZone: string): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Local calendar Date at noon for a YYYY-MM-DD key (avoids DST edge flips). */
export function dateFromDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function dayKeyFromLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function groupSlotsByDay(
  slots: BookingSlot[],
  timeZone: string,
): Map<string, BookingSlot[]> {
  const map = new Map<string, BookingSlot[]>();
  for (const slot of slots) {
    const key = dayKeyInTz(slot.startUtc, timeZone);
    const list = map.get(key);
    if (list) list.push(slot);
    else map.set(key, [slot]);
  }
  return map;
}

export function formatSlotTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDayHeading(dayKey: string, timeZone: string): string {
  return dateFromDayKey(dayKey).toLocaleDateString(undefined, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  slot_conflict: 'Ese hueco acaba de reservarlo otra persona. Elige otro.',
  rate_limited_ip:
    'Has hecho demasiadas reservas desde esta red. Espera un rato e inténtalo de nuevo.',
  rate_limited_email:
    'Has hecho demasiadas reservas con este email. Espera un rato e inténtalo de nuevo.',
  honeypot: 'No se pudo completar la reserva.',
  booking_failed: 'No se pudo completar la reserva. Inténtalo de nuevo.',
  slots_failed: 'No se pudieron cargar los huecos disponibles.',
};

/** Never show raw API codes like `slot_conflict` to the visitor. */
export function bookingErrorMessage(code: unknown, fallback?: string): string {
  if (typeof code !== 'string' || code.length === 0) {
    return fallback ?? 'No se pudo completar la reserva.';
  }
  if (BOOKING_ERROR_MESSAGES[code]) return BOOKING_ERROR_MESSAGES[code];
  // Snake_case codes from the API → generic copy; free text stays as-is.
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(code)) {
    return fallback ?? 'No se pudo completar la reserva.';
  }
  return code;
}

export const bookingCalendarLocale = es;
