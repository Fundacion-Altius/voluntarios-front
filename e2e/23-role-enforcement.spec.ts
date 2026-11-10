import { test, expect, request as playwrightRequest } from '@playwright/test';
import { randomId, CONTRACT_TEMPLATE, authHeaders, BACKEND_URL } from './helpers';

test.describe('Role-Based Access Control Enforcement', () => {
  const contractId = randomId('RBAC');

  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: authHeaders(authToken, csrfToken),
      data: { id: contractId, nombre: 'RBAC Test', areas: ['Nave'], ...CONTRACT_TEMPLATE, email: 'rbac@test.com' },
    });
    await ctx.dispose();
  });

  test('nave user PUT /api/contracts/:id returns 403', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'nave@fundacionaltius.org', password: 'nave123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts/${contractId}`, {
      method: 'PUT',
      headers: authHeaders(authToken, csrfToken),
      data: { nombre: 'Hacked' },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });

  test('nave user DELETE /api/contracts/:id returns 403', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'nave@fundacionaltius.org', password: 'nave123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts/${contractId}`, {
      method: 'DELETE',
      headers: authHeaders(authToken, csrfToken),
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });

  test('general user GET /api/users returns 403', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'general@fundacionaltius.org', password: 'general123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/users`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });

  test('general user POST /api/users returns 403', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'general@fundacionaltius.org', password: 'general123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: authHeaders(authToken, csrfToken),
      data: { name: 'Evil User', email: 'evil@test.com', role: 'admin', password: 'hack' },
    });
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    await ctx.fetch(`${BACKEND_URL}/api/contracts/${contractId}`, {
      method: 'DELETE',
      headers: authHeaders(authToken, csrfToken),
    });
    await ctx.dispose();
  });
});
