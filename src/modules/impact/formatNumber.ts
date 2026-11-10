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

/** Stored catalog codes. The screen shows the translated label, never the code. */
export const IMPACT_UNIT_CODES = [
  "people",
  "kg",
  "students",
  "volunteers",
  "families",
  "hours",
  "score",
  "entities",
  "members",
  "participants",
  "currency",
  "days",
  "people/hour",
  "%",
] as const;

const UNIT_MESSAGE_KEY: Record<string, string> = {
  people: "people",
  kg: "kg",
  students: "students",
  volunteers: "volunteers",
  families: "families",
  hours: "hours",
  score: "score",
  entities: "entities",
  members: "members",
  participants: "participants",
  currency: "currency",
  days: "days",
  "people/hour": "perHour",
};

/** Turns a stored unit code (`people`, `students`) into the active locale's word. */
export function localizeImpactUnit(
  unit: string | undefined,
  labelFor: (messageKey: string) => string,
): string {
  if (!unit) return "";
  if (unit === "%") return "%";
  const key = UNIT_MESSAGE_KEY[unit];
  return key ? labelFor(key) : unit;
}
