import { test, expect, request as playwrightRequest } from '@playwright/test';
import { randomId, CONTRACT_TEMPLATE, authHeaders, BACKEND_URL } from './helpers';

test.describe('Contract Detail View', () => {
  const naveContractId = randomId('DET-NAVE');

  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const adminLogin = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    });
    const { authToken, csrfToken } = await adminLogin.json();

    const createRes = await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: authHeaders(authToken, csrfToken),
      data: { id: naveContractId, nombre: 'Detail Test Nave', areas: ['Nave'], ...CONTRACT_TEMPLATE, email: 'detail-nave@test.com' },
    });
    expect(createRes.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('admin can view any contract by ID', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts/${naveContractId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(naveContractId);
    await ctx.dispose();
  });

  test('nave user can view a Nave-area contract by ID', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'nave@fundacionaltius.org', password: 'nave123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts/${naveContractId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.areas).toContain('Nave');
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    await ctx.fetch(`${BACKEND_URL}/api/contracts/${naveContractId}`, {
      method: 'DELETE',
      headers: authHeaders(authToken, csrfToken),
    });
    await ctx.dispose();
  });
});
