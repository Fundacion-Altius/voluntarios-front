import { test, expect, request as playwrightRequest } from '@playwright/test';
import { randomId, CONTRACT_TEMPLATE, authHeaders, BACKEND_URL } from './helpers';

test.describe('Pagination', () => {
  const createdIds: string[] = [];

  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken, csrfToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    for (let i = 0; i < 25; i++) {
      const id = randomId('PAG');
      createdIds.push(id);
      const res = await ctx.fetch(`${BACKEND_URL}/api/contracts`, {
        method: 'POST',
        headers: authHeaders(authToken, csrfToken),
        data: {
          id,
          nombre: `Pagination Test ${i}`,
          areas: ['Reparto de Alimentos'],
          ...CONTRACT_TEMPLATE,
          lugar: i % 2 === 0 ? 'Madrid' : 'Barcelona',
          email: `pag${i}@test.com`,
        },
      });
      if (!res.ok()) throw new Error(`Failed to create contract ${id}`);
    }
    await ctx.dispose();
  });

  test('response includes pagination metadata', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts?page=1&pageSize=5`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('pageSize');
    expect(body).toHaveProperty('totalPages');
    await ctx.dispose();
  });

  test('pageSize limits the number of returned contracts', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const res = await ctx.fetch(`${BACKEND_URL}/api/contracts?pageSize=5`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.pageSize).toBe(5);
    await ctx.dispose();
  });

  test('page parameter returns the correct slice', async () => {
    const ctx = await playwrightRequest.newContext();
    const { authToken } = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    }).then(r => r.json());

    const page1Res = await ctx.fetch(`${BACKEND_URL}/api/contracts?page=1&pageSize=10&sortBy=id&sortOrder=asc`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(page1Res.ok()).toBeTruthy();
    const page1 = await page1Res.json();
    expect(page1.page).toBe(1);

    const page2Res = await ctx.fetch(`${BACKEND_URL}/api/contracts?page=2&pageSize=10&sortBy=id&sortOrder=asc`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(page2Res.ok()).toBeTruthy();
    const page2 = await page2Res.json();
    expect(page2.page).toBe(2);

    const page1Ids = page1.data.map((c: any) => c.id);
    const page2Ids = page2.data.map((c: any) => c.id);
    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
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
