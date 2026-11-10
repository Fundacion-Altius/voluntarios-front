import { isDemoHouseholdCode, isDemoServiceLabel, isDemoSlotLabel } from './demoData';

describe('demoData markers', () => {
  it('detects demo household codes', () => {
    expect(isDemoHouseholdCode('demo01')).toBe(true);
    expect(isDemoHouseholdCode('DEMO07')).toBe(true);
    expect(isDemoHouseholdCode('abc12')).toBe(false);
  });

  it('detects demo slot labels', () => {
    expect(isDemoSlotLabel('Mañana (demo)')).toBe(true);
    expect(isDemoSlotLabel('Tarde')).toBe(false);
  });

  it('detects the seeded demo service label only', () => {
    expect(isDemoServiceLabel('Servicio mediodía · aula')).toBe(true);
    expect(isDemoServiceLabel('Servicio noche')).toBe(false);
  });
});
