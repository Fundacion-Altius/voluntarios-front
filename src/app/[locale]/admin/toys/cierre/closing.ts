/** Cierre (step 2): what is left per toy after earlier closures. */
export type Kind = 'stored' | 'redistributed';

export interface Item {
  id: string;
  title: string;
  ageBand?: string;
  quantity: number;
  cover?: string | null;
}

export interface Disposition {
  id: string;
  toy_id: string;
  quantity: number;
  kind: Kind;
  destination: string;
}

export interface Leftover extends Item {
  left: number;
}

/** Units still to decide per toy: stock minus what was already closed for it. */
export function leftovers(items: Item[], dispositions: Disposition[]): Leftover[] {
  return items
    .map((i) => ({
      ...i,
      left: i.quantity - dispositions.filter((d) => d.toy_id === i.id).reduce((n, d) => n + d.quantity, 0),
    }))
    .filter((i) => i.left > 0)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export interface Plan {
  stored: number;
  redistributed: number;
}

export function planTotals(rows: Leftover[], include: Record<string, boolean>, kinds: Record<string, Kind>): Plan {
  return rows.reduce(
    (acc, r) => (include[r.id] ? { ...acc, [kinds[r.id]]: acc[kinds[r.id]] + r.left } : acc),
    { stored: 0, redistributed: 0 },
  );
}
