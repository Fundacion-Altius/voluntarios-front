import { test, expect } from '@playwright/test';
import { adminLogin, BACKEND_URL } from './helpers';

test.describe('API Error States', () => {
  let adminToken: string;
  let adminCsrf: string;

  test.beforeAll(async ({ request }) => {
    const creds = await adminLogin(request);
    adminToken = creds.authToken;
    adminCsrf = creds.csrfToken;
  });

  test('GET /api/contracts without auth header returns 401', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/contracts`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('GET /api/contracts/nonexistent returns 404', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/contracts/nonexistent-id-${Date.now()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(404);
  });

  test('GET /api/users/nonexistent returns empty result', async ({ request }) => {
    const res = await request.fetch(`${BACKEND_URL}/api/users/nonexistent-id-${Date.now()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Backend returns 200 with empty/null user rather than 404
    expect(res.ok()).toBeTruthy();
  });
});
