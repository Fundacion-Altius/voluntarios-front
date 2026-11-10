import { ageMatch, bandForYears, derivePhase, firstSlotDate, nextAction, phaseState, stockLevel, totals, type CampaignData } from './campaign';

const empty: CampaignData = { items: [], children: [], slots: [], bookings: [], pending: [], dispositions: [] };

describe('toys campaign view', () => {
  it('maps ages to the backend bands', () => {
    expect(bandForYears(0)).toBe('under_1');
    expect(bandForYears(2)).toBe('y1_2');
    expect(bandForYears(7)).toBe('y5_7');
    expect(bandForYears(11)).toBe('y8_11');
    expect(bandForYears(15)).toBe('older');
    expect(bandForYears(-1)).toBeNull();
  });

  it('derives the phase from evidence only', () => {
    expect(derivePhase(empty, '2026-11-09')).toBe('preparar');
    const ready = { ...empty, items: [{ quantity: 3, ageBand: 'y5_7' }], children: [{ age: 6 }] };
    expect(derivePhase(ready, '2026-11-09')).toBe('reservas');
    const slots = { ...ready, slots: [{ date: '2026-12-20' }, { date: '2026-12-17' }] };
    expect(firstSlotDate(slots.slots)).toBe('2026-12-17');
    expect(derivePhase(slots, '2026-12-16')).toBe('reservas');
    expect(derivePhase(slots, '2026-12-17')).toBe('entrega');
    expect(derivePhase({ ...slots, dispositions: [{ quantity: 1 }] }, '2026-11-09')).toBe('cierre');
  });

  it('marks phases before, at and after the current one', () => {
    expect(phaseState('preparar', 'reservas')).toBe('done');
    expect(phaseState('reservas', 'reservas')).toBe('now');
    expect(phaseState('cierre', 'reservas')).toBe('later');
  });

  it('totals units, children and carts waiting to be collected', () => {
    const t = totals({
      ...empty,
      items: [{ quantity: 4 }, { quantity: 6 }],
      children: [{ age: 3 }],
      pending: [{ status: 'open' }, { status: 'checked_out' }],
    });
    expect(t).toMatchObject({ toyTypes: 2, toyUnits: 10, children: 1, toCollect: 1, closedUnits: 0 });
    expect(totals({ ...empty, children: null }).children).toBeNull();
  });

  it('compares toys and children per band', () => {
    const rows = ageMatch(
      [{ quantity: 2, ageBand: 'y5_7' }, { quantity: 1, ageBand: 'y8_11' }],
      [{ age: 6 }, { age: 9 }, { age: 10 }],
    );
    expect(rows).toEqual([
      { band: 'y5_7', toys: 2, kids: 1, diff: 1 },
      { band: 'y8_11', toys: 1, kids: 2, diff: -1 },
    ]);
  });

  it('points to one next action per phase', () => {
    expect(nextAction('preparar', empty).key).toBe('anadeJuguetes');
    expect(nextAction('preparar', { ...empty, items: [{}] }).key).toBe('inscribeNinos');
    expect(nextAction('reservas', empty).key).toBe('anadeTurnos');
    expect(nextAction('reservas', { ...empty, slots: [{}] }).href).toBe('/juguetes');
    expect(nextAction('entrega', empty).key).toBe('abreEscaner');
    expect(nextAction('cierre', empty).key).toBe('revisaCierre');
  });

  it('grades stock for the chip colour', () => {
    expect(stockLevel(0)).toBe('out');
    expect(stockLevel(5)).toBe('low');
    expect(stockLevel(6)).toBe('ok');
  });
});
