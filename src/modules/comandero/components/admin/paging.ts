/** Which slice of a list a page shows. The page is clamped, so deleting rows can never leave it empty. */
export function pageWindow(total: number, page: number, size: number) {
  const count = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(page, 0), count - 1);
  return { count, current, start: current * size, end: current * size + size };
}

/** Page that holds the item at `index` (used to jump to a row that was just appended). */
export function pageOfIndex(index: number, size: number): number {
  return Math.floor(index / size);
}
