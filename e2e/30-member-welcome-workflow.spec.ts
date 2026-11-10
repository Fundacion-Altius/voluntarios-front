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

    // Welcome email + metrics record after dispatchEmail; poll so a slow
    // mailpit/SMTP hiccup under parallel load does not flake the assertion.
    await expect
      .poll(
        async () => {
          const metricsRes = await request.fetch(`${BACKEND_URL}/api/automation/metrics`, {
            headers: authHeaders(authToken, csrfToken),
          });
          if (!metricsRes.ok()) return 0;
          const metrics = await metricsRes.json();
          return metrics.breakdown?.member_comms ?? 0;
        },
        { timeout: 15000 },
      )
      .toBeGreaterThanOrEqual(1);

    const metricsRes = await request.fetch(`${BACKEND_URL}/api/automation/metrics`, {
      headers: authHeaders(authToken, csrfToken),
    });
    expect(metricsRes.ok()).toBeTruthy();
    const metrics = await metricsRes.json();
    expect(metrics.tasksAutomated).toBeGreaterThanOrEqual(1);
  });
});
