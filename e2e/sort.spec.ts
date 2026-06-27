import { test, expect } from '@playwright/test';
import { adminLogin, BACKEND_URL } from './helpers';

test.describe('Sort Parameters', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const admin = await adminLogin(request);
    adminToken = admin.authToken;
  });

  test('sortBy nombre ascending returns contracts in alphabetical order', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/contracts?sortBy=nombre&sortOrder=asc&pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const names = body.data.map((c: any) => c.nombre);
    const sorted = [...names].sort((a: string, b: string) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('sortBy nombre descending returns contracts in reverse order', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/contracts?sortBy=nombre&sortOrder=desc&pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const names = body.data.map((c: any) => c.nombre);
    const sorted = [...names].sort((a: string, b: string) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });

  test('invalid sortBy returns 400', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/contracts?sortBy=invalidColumn`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
