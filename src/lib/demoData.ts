/** Client-side markers for seeded classroom demo rows (local:docker Altius only). */

const DEMO_HOUSEHOLD = /^demo/i;
const DEMO_SLOT_TAG = /\(demo\)\s*$/i;
/** Exact label from voluntarios-back altiusDemoCatalog DEMO_SERVICE. */
const DEMO_SERVICE_LABEL = "Servicio mediodía · aula";

export function isDemoHouseholdCode(code: string | null | undefined): boolean {
  return Boolean(code && DEMO_HOUSEHOLD.test(code.trim()));
}

export function isDemoSlotLabel(label: string | null | undefined): boolean {
  return Boolean(label && DEMO_SLOT_TAG.test(label));
}

export function isDemoServiceLabel(label: string | null | undefined): boolean {
  return Boolean(label && label.trim() === DEMO_SERVICE_LABEL);
}
