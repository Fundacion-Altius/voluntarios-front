import { assertLocaleParity, listDocParams, loadSidebar } from './loadDocs';

describe('docs content', () => {
  it('has sidebar sections', () => {
    const sidebar = loadSidebar();
    expect(sidebar.sections.length).toBeGreaterThan(0);
  });

  it('has es/ca/en files for every sidebar leaf', () => {
    expect(assertLocaleParity()).toEqual([]);
  });

  it('lists static params for three locales', () => {
    const params = listDocParams();
    expect(params.some((p) => p.locale === 'es' && p.slug.length === 0)).toBe(true);
    expect(params.some((p) => p.locale === 'ca')).toBe(true);
    expect(params.some((p) => p.locale === 'en')).toBe(true);
  });
});
