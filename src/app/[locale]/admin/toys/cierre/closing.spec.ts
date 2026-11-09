import { leftovers, planTotals } from './closing';

describe('cierre helpers', () => {
  const items = [
    { id: 'a', title: 'Zeta', quantity: 5 },
    { id: 'b', title: 'Alfa', quantity: 2 },
    { id: 'c', title: 'Cero', quantity: 0 },
  ];
  it('subtracts earlier closures and drops toys with nothing left', () => {
    const rows = leftovers(items, [{ id: 'd', toy_id: 'b', quantity: 2, kind: 'stored', destination: 'x' }, { id: 'e', toy_id: 'a', quantity: 1, kind: 'stored', destination: 'x' }]);
    expect(rows.map((r) => [r.id, r.left])).toEqual([['a', 4]]);
  });
  it('adds up the plan by kind for included rows', () => {
    const rows = leftovers(items, []);
    expect(planTotals(rows, { a: true, b: true }, { a: 'stored', b: 'redistributed' })).toEqual({ stored: 5, redistributed: 2 });
    expect(planTotals(rows, { a: false, b: true }, { a: 'stored', b: 'stored' })).toEqual({ stored: 2, redistributed: 0 });
  });
});
