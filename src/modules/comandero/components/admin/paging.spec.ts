import { pageOfIndex, pageWindow } from './paging';

describe('comandero admin paging', () => {
  it('always has at least one page, even with no items', () => {
    expect(pageWindow(0, 0, 10)).toEqual({ count: 1, current: 0, start: 0, end: 10 });
  });

  it('counts pages and gives the slice of the current one', () => {
    expect(pageWindow(25, 1, 10)).toEqual({ count: 3, current: 1, start: 10, end: 20 });
    expect(pageWindow(20, 1, 10).count).toBe(2);
  });

  it('clamps a page that no longer exists after rows are deleted', () => {
    expect(pageWindow(10, 4, 10).current).toBe(0);
    expect(pageWindow(25, 9, 10).current).toBe(2);
  });

  it('never goes below the first page', () => {
    expect(pageWindow(25, -3, 10).current).toBe(0);
  });

  it('finds the page of an appended item', () => {
    expect(pageOfIndex(0, 10)).toBe(0);
    expect(pageOfIndex(9, 10)).toBe(0);
    expect(pageOfIndex(10, 10)).toBe(1);
    expect(pageOfIndex(25, 10)).toBe(2);
  });
});
