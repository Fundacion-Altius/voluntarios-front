/**
 * Impact figures follow the active locale: es/ca group thousands with a dot
 * (9.840) and en with a comma (9,840). Decimals use the same locale.
 */
export function formatImpactNumber(value: number, locale: string): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
