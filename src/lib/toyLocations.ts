/**
 * Storage options for the toys inventory: put away in the warehouse,
 * or out in the store where handover happens.
 * The backend still accepts any non-empty location; the UI constrains
 * entries to this list.
 */
export const TOY_LOCATIONS = ['warehouse', 'store'] as const;

export type ToyLocationKey = (typeof TOY_LOCATIONS)[number];
