import { getCSRFToken, setAuthToken, getAuthToken } from './csrf';

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_API_URL;

function clearCookies(): void {
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
  clearCookies();
  setAuthToken(null);
});

afterAll(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_ENV;
});

describe('getCSRFToken', () => {
  it('returns null when no csrf_token cookie exists', () => {
    expect(getCSRFToken()).toBeNull();
  });

  it('returns token value from csrf_token cookie', () => {
    document.cookie = 'csrf_token=abc123def456';
    expect(getCSRFToken()).toBe('abc123def456');
  });

  it('handles cookies with multiple values', () => {
    document.cookie = 'auth_token=xyz';
    document.cookie = 'csrf_token=token789';
    document.cookie = 'other=val';
    expect(getCSRFToken()).toBe('token789');
  });
});

describe('setAuthToken / getAuthToken', () => {
  it('stores and retrieves auth token', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('test-jwt');
    expect(getAuthToken()).toBe('test-jwt');
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });
});
