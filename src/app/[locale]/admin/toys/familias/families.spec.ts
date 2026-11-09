import { countByStatus, filterChildren, filterFamilies, type Family } from './families';

const fam = (code: string, status: Family['status']): Family => ({
  code,
  status,
  toy_quota: 1,
  slot_id: null,
  toys: 0,
  delivered_at: null,
  problem_note: null,
});

describe('familias helpers', () => {
  it('filters families by status and code', () => {
    const list = [fam('demo01', 'recogido'), fam('demo02', 'inscrita'), fam('abc', 'inscrita')];
    expect(filterFamilies(list, 'inscrita', '').map((f) => f.code)).toEqual(['demo02', 'abc']);
    expect(filterFamilies(list, 'all', 'DEMO').map((f) => f.code)).toEqual(['demo01', 'demo02']);
    expect(countByStatus(list)).toEqual({ inscrita: 2, reservado: 0, recogido: 1 });
  });

  it('sorts and searches children', () => {
    const kids = [{ id: '2', label: 'Niño B', age: 3 }, { id: '1', label: 'Niño A', age: 5 }];
    expect(filterChildren(kids, '').map((c) => c.id)).toEqual(['1', '2']);
    expect(filterChildren(kids, 'b').map((c) => c.id)).toEqual(['2']);
  });
});
