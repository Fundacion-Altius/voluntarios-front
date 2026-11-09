/** Familias y niños (step 2): shapes and filters. Family status comes from GET /families. */
export type FamilyStatus = 'inscrita' | 'reservado' | 'recogido';
export const FAMILY_STATUSES: FamilyStatus[] = ['inscrita', 'reservado', 'recogido'];

export interface Family {
  code: string;
  toy_quota: number;
  status: FamilyStatus;
  slot_id: string | null;
  toys: number;
  delivered_at: string | null;
  problem_note: string | null;
}

export interface Child {
  id: string;
  label: string;
  age: number;
}

export function filterFamilies(list: Family[], status: FamilyStatus | 'all', query: string): Family[] {
  const q = query.trim().toLowerCase();
  return list.filter((f) => (status === 'all' || f.status === status) && (q === '' || f.code.includes(q)));
}

export function countByStatus(list: Family[]): Record<FamilyStatus, number> {
  return FAMILY_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: list.filter((f) => f.status === s).length }),
    { inscrita: 0, reservado: 0, recogido: 0 },
  );
}

export function filterChildren(list: Child[], query: string): Child[] {
  const q = query.trim().toLowerCase();
  const sorted = [...list].sort((a, b) => a.label.localeCompare(b.label));
  return q === '' ? sorted : sorted.filter((c) => c.label.toLowerCase().includes(q));
}
