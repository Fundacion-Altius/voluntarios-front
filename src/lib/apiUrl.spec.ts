import { getApiBaseUrl } from './apiUrl';

describe('getApiBaseUrl', () => {
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
  });

  it('uses same-origin on tenant hosts', () => {
    Object.defineProperty(global, 'window', {
      value: { location: { hostname: 'fundacionaltius.klaruk.com', protocol: 'https:', host: 'fundacionaltius.klaruk.com' } },
      writable: true,
    });
    expect(getApiBaseUrl()).toBe('https://fundacionaltius.klaruk.com');
  });

  it('uses NEXT_PUBLIC_API_URL on local tenant hosts', () => {
    Object.defineProperty(global, 'window', {
      value: { location: { hostname: 'homelessentrepreneur.localhost', protocol: 'http:', host: 'homelessentrepreneur.localhost:3000' } },
      writable: true,
    });
    expect(getApiBaseUrl()).toBe(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  });
});
