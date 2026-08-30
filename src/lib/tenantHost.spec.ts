import { should404UnknownTenantHost } from './tenantHost';

describe('should404UnknownTenantHost', () => {
  it('404s unknown tenant slugs', () => {
    expect(should404UnknownTenantHost('unknown.klaruk.com')).toBe(true);
    expect(should404UnknownTenantHost('ghost.localhost:3000')).toBe(true);
  });

  it('allows known slugs, apex, and plain localhost', () => {
    expect(should404UnknownTenantHost('fundacionaltius.klaruk.com')).toBe(false);
    expect(should404UnknownTenantHost('homelessentrepreneur.localhost:3000')).toBe(false);
    expect(should404UnknownTenantHost('klaruk.com')).toBe(false);
    expect(should404UnknownTenantHost('localhost:3000')).toBe(false);
  });
});
