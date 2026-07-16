import { test, expect, request as playwrightRequest } from '@playwright/test';
import { randomId, CONTRACT_TEMPLATE, BACKEND_URL } from './helpers';

test.describe('CSRF Token Validation', () => {
  const contractPayload = () => ({
    id: randomId('CSRF'),
    nombre: 'CSRF Test',
    areas: ['Nave'],
    ...CONTRACT_TEMPLATE,
    email: 'csrf@test.com',
  });

  test('POST /api/contracts with valid cookie but no CSRF header returns 403', async () => {
    const ctx = await playwrightRequest.newContext();
    const adminLogin = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    });
    const { authToken } = await adminLogin.json();

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      data: contractPayload(),
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });

  test('POST /api/contracts with valid cookie but fake CSRF header returns 403', async () => {
    const ctx = await playwrightRequest.newContext();
    const adminLogin = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    });
    const { authToken } = await adminLogin.json();

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': 'fake-csrf-token-value',
      },
      data: contractPayload(),
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });
});
