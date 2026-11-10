/**
 * Money display for the comandero. Prices are integer cents; the payment is simulated, so this
 * is only ever presentation. Uses the active locale so es/ca show "1,50 €" and en shows "€1.50".
 */
export function formatMoney(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** "HH:mm" of an ISO timestamp in the active locale (when a service was opened). */
export function formatClock(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}
