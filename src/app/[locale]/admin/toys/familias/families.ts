/** Familias: shapes, filters and paging. Family status comes from GET /families. */
export type FamilyStatus = 'inscrita' | 'reservado' | 'recogido';
export const FAMILY_STATUSES: FamilyStatus[] = ['inscrita', 'reservado', 'recogido'];

/** Families shown per page of the list. */
export const FAMILY_PAGE_SIZE = 10;

export interface Family {
  code: string;
  toy_quota: number;
  status: FamilyStatus;
  slot_id: string | null;
  toys: number;
  delivered_at: string | null;
  problem_note: string | null;
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

/**
 * One page of the (already filtered) list. The page is clamped, so a filter or a delete that
 * shrinks the list never leaves an empty page on screen. `from`/`to` are 1-based for display.
 */
export function familyPage<T>(rows: T[], page: number, size = FAMILY_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(page, 0), pages - 1);
  const start = current * size;
  const slice = rows.slice(start, start + size);
  return {
    rows: slice,
    page: current,
    pages,
    from: slice.length ? start + 1 : 0,
    to: start + slice.length,
    total: rows.length,
  };
}
