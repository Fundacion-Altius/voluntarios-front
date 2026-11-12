import { test, expect, type Page } from '@playwright/test';
import { loginAsBrowser } from './helpers';

/**
 * Browser: join video room UI.
 * POST /api/video/rooms → videoApi.spec.ts
 * Room seed uses same-origin page.request (Next rewrite), not BACKEND_URL.
 */
async function createRoomViaFront(page: Page, contextType: 'community' | 'lms', contextId: string): Promise<string> {
  const roomRes = await page.request.post('/api/video/rooms', {
    data: { contextType, contextId, participantUserIds: [] },
  });
  expect(roomRes.ok()).toBeTruthy();
  const roomBody = await roomRes.json();
  const roomId = roomBody.data?.roomId as string;
  expect(roomId).toBeTruthy();
  return roomId;
}

test.describe('Video: 1-to-1 tutoring flow', () => {
  test('instructor creates room, volunteer joins', async ({ browser }) => {
    const instructorCtx = await browser.newContext();
    const volunteerCtx = await browser.newContext();
    const instructorPage = await instructorCtx.newPage();
    const volunteerPage = await volunteerCtx.newPage();

    await loginAsBrowser(instructorPage, 'instructor@fundacionaltius.org', 'instructor123');
    await loginAsBrowser(volunteerPage, 'voluntario@fundacionaltius.org', 'voluntario123');

    const roomId = await createRoomViaFront(instructorPage, 'community', 'proj1');

    await instructorPage.goto(`/es/portal/sala/${roomId}`);
    await expect(instructorPage.getByText('Unirse a sala de video')).toBeVisible({ timeout: 5000 });
    await instructorPage.getByRole('button', { name: 'Unirse a la sala' }).click();
    await expect(instructorPage.getByRole('button', { name: 'Leave call' })).toBeVisible({ timeout: 15000 });

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

test.describe('Video: 1-to-many live class flow', () => {
  test('instructor creates room from activity session, volunteer joins', async ({ browser }) => {
    const instructorCtx = await browser.newContext();
    const volunteerCtx = await browser.newContext();
    const instructorPage = await instructorCtx.newPage();
    const volunteerPage = await volunteerCtx.newPage();

    await loginAsBrowser(instructorPage, 'instructor@fundacionaltius.org', 'instructor123');
    await loginAsBrowser(volunteerPage, 'voluntario@fundacionaltius.org', 'voluntario123');

    const roomId = await createRoomViaFront(instructorPage, 'lms', 'activity-1');

    await instructorPage.goto(`/es/portal/sala/${roomId}`);
    await expect(instructorPage.getByText('Unirse a sala de video')).toBeVisible({ timeout: 5000 });
    await instructorPage.getByRole('button', { name: 'Unirse a la sala' }).click();
    await expect(instructorPage.getByRole('button', { name: 'Leave call' })).toBeVisible({ timeout: 15000 });

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
