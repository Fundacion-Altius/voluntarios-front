import { test, expect } from '@playwright/test';
import { BACKEND_URL, adminLogin, authHeaders } from './helpers';

test.describe('Member welcome workflow', () => {
  test('creating a member queues a welcome workflow and records automation metrics', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);
    const email = `welcome-${Date.now()}@test.com`;

    const createRes = await request.fetch(`${BACKEND_URL}/api/members`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: { fullName: 'Welcome Flow', email },
    });
    expect(createRes.ok()).toBeTruthy();

    const metricsRes = await request.fetch(`${BACKEND_URL}/api/automation/metrics`, {
      headers: authHeaders(authToken, csrfToken),
    });
    expect(metricsRes.ok()).toBeTruthy();
    const metrics = await metricsRes.json();
    expect(metrics.breakdown.member_comms).toBeGreaterThanOrEqual(1);
    expect(metrics.tasksAutomated).toBeGreaterThanOrEqual(1);
  });
});
