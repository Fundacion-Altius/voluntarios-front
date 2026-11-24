import {
  bookingErrorMessage,
  dateFromDayKey,
  dayKeyFromLocalDate,
  dayKeyInTz,
  groupSlotsByDay,
} from './bookingUi';

describe('bookingUi', () => {
  it('maps API error codes to Spanish copy and never leaks slot_conflict', () => {
    expect(bookingErrorMessage('slot_conflict')).toMatch(/otra persona/i);
    expect(bookingErrorMessage('slot_conflict')).not.toContain('slot_conflict');
    expect(bookingErrorMessage('rate_limited_ip')).toMatch(/demasiadas reservas/i);
    expect(bookingErrorMessage('unknown_snake_code')).toMatch(/No se pudo completar/);
    expect(bookingErrorMessage('Elige un hueco.')).toBe('Elige un hueco.');
    expect(bookingErrorMessage(undefined)).toMatch(/No se pudo completar/);
  });

  it('groups slots by calendar day in the visitor timezone', () => {
    const slots = [
      { startUtc: '2026-11-25T09:00:00.000Z', endUtc: '2026-11-25T09:30:00.000Z' },
      { startUtc: '2026-11-25T10:00:00.000Z', endUtc: '2026-11-25T10:30:00.000Z' },
      { startUtc: '2026-11-26T09:00:00.000Z', endUtc: '2026-11-26T09:30:00.000Z' },
    ];
    const byDay = groupSlotsByDay(slots, 'Europe/Madrid');
    expect(byDay.get('2026-11-25')).toHaveLength(2);
    expect(byDay.get('2026-11-26')).toHaveLength(1);
    expect(dayKeyInTz(slots[0].startUtc, 'Europe/Madrid')).toBe('2026-11-25');
  });

  it('round-trips local Date ↔ day key', () => {
    const key = '2026-12-03';
    expect(dayKeyFromLocalDate(dateFromDayKey(key))).toBe(key);
  });
});
