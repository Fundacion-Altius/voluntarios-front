import { test, expect, request as playwrightRequest } from '@playwright/test';
import { randomId, CONTRACT_TEMPLATE, authHeaders, BACKEND_URL } from './helpers';

test.describe('Lugar Query Parameter Filtering', () => {
  const createdIds: string[] = [];

  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const madridId = randomId('LUG-MAD');
    createdIds.push(madridId);
    await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: authHeaders(authToken, csrfToken),
      data: { id: madridId, nombre: 'Madrid Test', areas: ['Nave'], ...CONTRACT_TEMPLATE, lugar: 'Madrid', email: 'madrid@test.com' },
    });

    const bcnId = randomId('LUG-BCN');
    createdIds.push(bcnId);
    await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: authHeaders(authToken, csrfToken),
      data: { id: bcnId, nombre: 'Barcelona Test', areas: ['Reparto de Alimentos'], ...CONTRACT_TEMPLATE, lugar: 'Barcelona', email: 'bcn@test.com' },
    });
    await ctx.dispose();
  });

  test('single lugar filter returns only matching contracts', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts?lugar=Madrid&pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const allMadrid = body.data.every((c: any) => c.lugar === 'Madrid');
    expect(allMadrid).toBe(true);
    await ctx.dispose();
  });

  test('multiple lugares filter returns contracts from either city', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts?lugar=Madrid&lugar=Barcelona&pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const allMatch = body.data.every((c: any) => c.lugar === 'Madrid' || c.lugar === 'Barcelona');
    expect(allMatch).toBe(true);
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    for (const id of createdIds) {
      await ctx.fetch(`${BACKEND_URL}/api/contracts/${id}`, {
        method: 'DELETE',
        headers: authHeaders(authToken, csrfToken),
      });
    }
    await ctx.dispose();
  });
});
