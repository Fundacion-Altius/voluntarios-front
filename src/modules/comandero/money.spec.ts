import { formatClock, formatMoney } from './money';

/** Intl puts a no-break space before the euro sign in es/ca; compare with a normal space. */
const plain = (s: string) => s.replace(/\u00a0/g, ' ');

describe('comandero money', () => {
  it('shows an empty order as zero euros, not blank', () => {
    expect(plain(formatMoney(0, 'es'))).toBe('0,00 €');
  });

  it('formats cents with the locale separators', () => {
    expect(plain(formatMoney(850, 'es'))).toBe('8,50 €');
    expect(plain(formatMoney(850, 'ca'))).toBe('8,50 €');
    expect(plain(formatMoney(850, 'en'))).toBe('€8.50');
  });

  it('keeps thousands readable', () => {
    expect(plain(formatMoney(123456, 'es'))).toBe('1234,56 €');
  });

  it('formats a clock time in the locale', () => {
    const iso = new Date(2026, 10, 12, 12, 5).toISOString();
    expect(formatClock(iso, 'es')).toMatch(/12:05/);
  });
});
