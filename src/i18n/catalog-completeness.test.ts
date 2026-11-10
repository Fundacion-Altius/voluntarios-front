import esMessages from '../../messages/es.json';
import caMessages from '../../messages/ca.json';
import enMessages from '../../messages/en.json';

function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('Message catalogs', () => {
  it('es.json and ca.json have identical key structures', () => {
    const esKeys = flattenKeys(esMessages).sort();
    const caKeys = flattenKeys(caMessages).sort();

    const missingInCa = esKeys.filter((k) => !caKeys.includes(k));
    const missingInEs = caKeys.filter((k) => !esKeys.includes(k));

    expect(missingInCa).toEqual([]);
    expect(missingInEs).toEqual([]);
  });

  it('en.json matches es.json and ca.json key structures', () => {
    const esKeys = flattenKeys(esMessages).sort();
    const enKeys = flattenKeys(enMessages).sort();

    const missingInEn = esKeys.filter((k) => !enKeys.includes(k));
    const missingInEs = enKeys.filter((k) => !esKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInEs).toEqual([]);
  });

  it('no catalog value is an empty string', () => {
    const esKeys = flattenKeys(esMessages);
    const caKeys = flattenKeys(caMessages);
    const enKeys = flattenKeys(enMessages);

    const emptyInEs = esKeys.filter((k) => {
      const parts = k.split('.');
      let val: any = esMessages;
      for (const p of parts) val = val?.[p];
      return val === '';
    });

    const emptyInCa = caKeys.filter((k) => {
      const parts = k.split('.');
      let val: any = caMessages;
      for (const p of parts) val = val?.[p];
      return val === '';
    });

    const emptyInEn = enKeys.filter((k) => {
      const parts = k.split('.');
      let val: any = enMessages;
      for (const p of parts) val = val?.[p];
      return val === '';
    });

    expect(emptyInEs).toEqual([]);
    expect(emptyInCa).toEqual([]);
    expect(emptyInEn).toEqual([]);
  });
});
