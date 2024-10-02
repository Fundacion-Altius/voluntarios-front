// validateDNI.test.ts
import { validateDNI } from './utils';

describe('validateDNI', () => {
  it('should return true for a valid DNI', () => {
    expect(validateDNI('35248660X')).toBe(true);
  });

  it('should return false for a DNI with an incorrect letter', () => {
    expect(validateDNI('12345678A')).toBe(false);
  });

  it('should return true for a valid NIE', () => {
    expect(validateDNI('X6090907R')).toBe(true);
  });

  it('should return false for a NIE with an incorrect letter', () => {
    expect(validateDNI('X1234567A')).toBe(false);
  });

  it('should return false for an invalid DNI format', () => {
    expect(validateDNI('1234')).toBe(false);
  });

  it('should return false for an invalid NIE format', () => {
    expect(validateDNI('A1234567T')).toBe(false);
  });

  it('should return false for a DNI with extra characters', () => {
    expect(validateDNI('12345678ZZ')).toBe(false);
  });

  it('should return false for a NIE with an invalid starting letter', () => {
    expect(validateDNI('B1234567T')).toBe(false);
  });
});
