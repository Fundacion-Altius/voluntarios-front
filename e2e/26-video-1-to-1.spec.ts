import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { loginAsBrowser } from './helpers';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

async function loginAs(ctx: BrowserContext, page: Page, email: string, password: string): Promise<{ authToken: string; csrfToken: string }> {
  await loginAsBrowser(page, email, password);

  const res = await page.request.post(`${BACKEND}/api/auth/login`, { data: { email, password } });
  const { authToken, csrfToken } = await res.json();
  return { authToken, csrfToken };
}

test.describe('Video: 1-to-1 tutoring flow', () => {
  test('instructor creates room, volunteer joins', async ({ browser }) => {
    const instructorCtx = await browser.newContext();
    const volunteerCtx = await browser.newContext();

    const instructorPage = await instructorCtx.newPage();
    const volunteerPage = await volunteerCtx.newPage();

    // Login as instructor
    const instructorAuth = await loginAs(instructorCtx, instructorPage, 'instructor@fundacionaltius.org', 'instructor123');

    // Login as volunteer
    await loginAs(volunteerCtx, volunteerPage, 'voluntario@fundacionaltius.org', 'voluntario123');

    // Instructor navigates to a video room (create via API)
    const roomRes = await instructorPage.request.post(`${BACKEND}/api/video/rooms`, {
      data: {
        contextType: 'community',
        contextId: 'proj1',
        participantUserIds: [],
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.authToken}`,
        'X-CSRF-Token': instructorAuth.csrfToken,
      },
    });
    expect(roomRes.ok()).toBeTruthy();
    const roomBody = await roomRes.json();
    const roomId = roomBody.data?.roomId;

    // Instructor joins room
    await instructorPage.goto(`/es/portal/sala/${roomId}`);
    await expect(instructorPage.getByText('Unirse a sala de video')).toBeVisible({ timeout: 5000 });
    await instructorPage.getByRole('button', { name: 'Unirse a la sala' }).click();
    await expect(instructorPage.getByRole('button', { name: 'Leave call' })).toBeVisible({ timeout: 15000 });

    // Volunteer joins room
    await volunteerPage.goto(`/es/portal/sala/${roomId}`);
    await expect(volunteerPage.getByText('Unirse a sala de video')).toBeVisible({ timeout: 5000 });
    await volunteerPage.getByRole('button', { name: 'Unirse a la sala' }).click();
    await expect(volunteerPage.getByRole('button', { name: 'Leave call' })).toBeVisible({ timeout: 15000 });

    // Cleanup
    await instructorPage.close();
    await volunteerPage.close();
    await instructorCtx.close();
    await volunteerCtx.close();
  });
});

test.describe('Video: 1-to-many live class flow', () => {
  test('instructor creates room from activity session, volunteer joins', async ({ browser }) => {
    const instructorCtx = await browser.newContext();
    const volunteerCtx = await browser.newContext();

    const instructorPage = await instructorCtx.newPage();
    const volunteerPage = await volunteerCtx.newPage();

    // Login as instructor
    const instructorAuth = await loginAs(instructorCtx, instructorPage, 'instructor@fundacionaltius.org', 'instructor123');

    // Login as volunteer
    await loginAs(volunteerCtx, volunteerPage, 'voluntario@fundacionaltius.org', 'voluntario123');

    // Create a video room linked to an activity session
    const roomRes = await instructorPage.request.post(`${BACKEND}/api/video/rooms`, {
      data: {
        contextType: 'lms',
        contextId: 'activity-1',
        participantUserIds: [],
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorAuth.authToken}`,
        'X-CSRF-Token': instructorAuth.csrfToken,
      },
    });
    expect(roomRes.ok()).toBeTruthy();
    const roomBody = await roomRes.json();
    const roomId = roomBody.data?.roomId;

    // Instructor joins
    await instructorPage.goto(`/es/portal/sala/${roomId}`);
    await expect(instructorPage.getByText('Unirse a sala de video')).toBeVisible({ timeout: 5000 });
    await instructorPage.getByRole('button', { name: 'Unirse a la sala' }).click();
    await expect(instructorPage.getByRole('button', { name: 'Leave call' })).toBeVisible({ timeout: 15000 });

    // Volunteer joins
    await volunteerPage.goto(`/es/portal/sala/${roomId}`);
    await expect(volunteerPage.getByText('Unirse a sala de video')).toBeVisible({ timeout: 5000 });
    await volunteerPage.getByRole('button', { name: 'Unirse a la sala' }).click();
    await expect(volunteerPage.getByRole('button', { name: 'Leave call' })).toBeVisible({ timeout: 15000 });

    await instructorPage.close();
    await volunteerPage.close();
    await instructorCtx.close();
    await volunteerCtx.close();
  });
});
