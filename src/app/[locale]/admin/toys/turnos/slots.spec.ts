import { addDays, bookedCount, initialWeek, placesTotal, slotFill, sortSlots, weekDays, weekStart } from './slots';

describe('turnos helpers', () => {
  it('finds the Monday of a week and its seven days', () => {
    expect(weekStart('2026-12-17')).toBe('2026-12-14');
    expect(weekStart('2026-12-20')).toBe('2026-12-14');
    expect(weekStart('2026-12-14')).toBe('2026-12-14');
    expect(weekDays('2026-12-14')).toEqual(['2026-12-14', '2026-12-15', '2026-12-16', '2026-12-17', '2026-12-18', '2026-12-19', '2026-12-20']);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('opens the next week with slots', () => {
    const slots = [{ id: 'a', date: '2026-12-01', label: '' }, { id: 'b', date: '2026-12-17', label: '' }];
    expect(initialWeek(slots, '2026-12-10')).toBe('2026-12-14');
    expect(initialWeek(slots, '2027-01-10')).toBe('2026-11-30');
    expect(initialWeek([], '2026-11-11')).toBe('2026-11-09');
  });

  it('computes fill and places', () => {
    const slots = [
      { id: 'a', date: '2026-12-14', label: '', capacity: 2, start_time: '17:00' },
      { id: 'b', date: '2026-12-14', label: '', capacity: null, start_time: '10:00' },
    ];
    const bookings = [{ slot_id: 'a', household_id: 'x' }, { slot_id: 'a', household_id: 'y' }, { slot_id: 'b', household_id: 'z' }];
    expect(bookedCount('a', bookings)).toBe(2);
    expect(slotFill(slots[0], 2)).toBe('full');
    expect(slotFill(slots[0], 1)).toBe('free');
    expect(slotFill(slots[1], 9)).toBe('open');
    expect(placesTotal(slots, bookings)).toEqual({ booked: 2, capacity: 2 });
    expect(sortSlots(slots).map((s) => s.id)).toEqual(['b', 'a']);
  });
});
