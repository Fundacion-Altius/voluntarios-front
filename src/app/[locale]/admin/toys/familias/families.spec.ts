import { countByStatus, familyPage, filterFamilies, FAMILY_PAGE_SIZE, type Family } from './families';

const fam = (code: string, status: Family['status']): Family => ({
  code,
  status,
  toy_quota: 1,
  slot_id: null,
  toys: 0,
  delivered_at: null,
  problem_note: null,
});

const many = (n: number) => Array.from({ length: n }, (_, i) => fam(`f${String(i + 1).padStart(2, '0')}`, 'inscrita'));

describe('familias helpers', () => {
  it('filters families by status and code', () => {
    const list = [fam('demo01', 'recogido'), fam('demo02', 'inscrita'), fam('abc', 'inscrita')];
    expect(filterFamilies(list, 'inscrita', '').map((f) => f.code)).toEqual(['demo02', 'abc']);
    expect(filterFamilies(list, 'all', 'DEMO').map((f) => f.code)).toEqual(['demo01', 'demo02']);
    expect(countByStatus(list)).toEqual({ inscrita: 2, reservado: 0, recogido: 1 });
  });
});

describe('familyPage', () => {
  it('shows ten families per page', () => {
    expect(FAMILY_PAGE_SIZE).toBe(10);
    const first = familyPage(many(23), 0);
    expect(first.rows.map((f) => f.code)).toEqual(many(10).map((f) => f.code));
    expect(first).toMatchObject({ page: 0, pages: 3, from: 1, to: 10, total: 23 });
  });

  it('gives the rest on the last page', () => {
    const last = familyPage(many(23), 2);
    expect(last.rows.map((f) => f.code)).toEqual(['f21', 'f22', 'f23']);
    expect(last).toMatchObject({ page: 2, pages: 3, from: 21, to: 23 });
  });

  it('has one empty page when there are no families', () => {
    expect(familyPage([], 0)).toEqual({ rows: [], page: 0, pages: 1, from: 0, to: 0, total: 0 });
  });

  it('keeps an exact multiple of ten on full pages', () => {
    expect(familyPage(many(20), 1)).toMatchObject({ pages: 2, from: 11, to: 20 });
    expect(familyPage(many(20), 1).rows).toHaveLength(10);
  });

  it('clamps a page that no longer exists, e.g. after a filter or a delete', () => {
    expect(familyPage(many(12), 5)).toMatchObject({ page: 1, from: 11, to: 12 });
    expect(familyPage(many(12), -1)).toMatchObject({ page: 0, from: 1 });
  });
});
