import { test, expect } from '@playwright/test';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

test.describe('Video: 1-to-1 tutoring flow', () => {
  test('instructor creates room, volunteer joins', async ({ browser }) => {
    const instructorCtx = await browser.newContext();
    const volunteerCtx = await browser.newContext();

    const instructorPage = await instructorCtx.newPage();
    const volunteerPage = await volunteerCtx.newPage();

    // Login as instructor
    await instructorPage.goto('/login');
    await instructorPage.waitForFunction(() => document.querySelector('form') && Object.keys(document.querySelector('form')!).some(k => k.startsWith('__react')), { timeout: 5000 });
    await instructorPage.fill('input[type="email"]', 'instructor@fundacionaltius.org');
    await instructorPage.fill('input[type="password"]', 'instructor123');
    await instructorPage.click('button[type="submit"]');
    await instructorPage.waitForURL('**/portal', { timeout: 20000 });

    // Login as volunteer
    await volunteerPage.goto('/login');
    await volunteerPage.waitForFunction(() => document.querySelector('form') && Object.keys(document.querySelector('form')!).some(k => k.startsWith('__react')), { timeout: 5000 });
    await volunteerPage.fill('input[type="email"]', 'voluntario@fundacionaltius.org');
    await volunteerPage.fill('input[type="password"]', 'voluntario123');
    await volunteerPage.click('button[type="submit"]');
    await volunteerPage.waitForURL('**/portal', { timeout: 20000 });

    // Instructor navigates to a video room (create via API)
    const roomRes = await instructorPage.request.post(`${BACKEND}/api/video/rooms`, {
      data: {
        contextType: 'community',
        contextId: 'proj1',
        participantUserIds: [],
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(roomRes.ok()).toBeTruthy();
    const roomBody = await roomRes.json();
    const roomId = roomBody.data?.id || roomBody.roomId;

    // Instructor joins room
    await instructorPage.goto(`/portal/sala/${roomId}`);
    await expect(instructorPage.getByText('Join video room')).toBeVisible({ timeout: 5000 });
    await instructorPage.getByRole('button', { name: 'Join room' }).click();
    await expect(instructorPage.getByText(/Joining/)).toBeVisible({ timeout: 3000 });

    // Volunteer joins room
    await volunteerPage.goto(`/portal/sala/${roomId}`);
    await expect(volunteerPage.getByText('Join video room')).toBeVisible({ timeout: 5000 });
    await volunteerPage.getByRole('button', { name: 'Join room' }).click();
    await expect(volunteerPage.getByText(/Joining/)).toBeVisible({ timeout: 3000 });

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
    await instructorPage.goto('/login');
    await instructorPage.waitForFunction(() => document.querySelector('form') && Object.keys(document.querySelector('form')!).some(k => k.startsWith('__react')), { timeout: 5000 });
    await instructorPage.fill('input[type="email"]', 'instructor@fundacionaltius.org');
    await instructorPage.fill('input[type="password"]', 'instructor123');
    await instructorPage.click('button[type="submit"]');
    await instructorPage.waitForURL('**/portal', { timeout: 20000 });

    // Login as volunteer
    await volunteerPage.goto('/login');
    await volunteerPage.waitForFunction(() => document.querySelector('form') && Object.keys(document.querySelector('form')!).some(k => k.startsWith('__react')), { timeout: 5000 });
    await volunteerPage.fill('input[type="email"]', 'voluntario@fundacionaltius.org');
    await volunteerPage.fill('input[type="password"]', 'voluntario123');
    await volunteerPage.click('button[type="submit"]');
    await volunteerPage.waitForURL('**/portal', { timeout: 20000 });

    // Create a video room linked to an activity session
    const roomRes = await instructorPage.request.post(`${BACKEND}/api/video/rooms`, {
      data: {
        contextType: 'lms',
        contextId: 'activity-1',
        participantUserIds: [],
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(roomRes.ok()).toBeTruthy();
    const roomBody = await roomRes.json();
    const roomId = roomBody.data?.id || roomBody.roomId;

    // Instructor joins
    await instructorPage.goto(`/portal/sala/${roomId}`);
    await expect(instructorPage.getByText('Join video room')).toBeVisible({ timeout: 5000 });
    await instructorPage.getByRole('button', { name: 'Join room' }).click();
    await expect(instructorPage.getByText(/Joining/)).toBeVisible({ timeout: 3000 });

    // Volunteer joins
    await volunteerPage.goto(`/portal/sala/${roomId}`);
    await expect(volunteerPage.getByText('Join video room')).toBeVisible({ timeout: 5000 });
    await volunteerPage.getByRole('button', { name: 'Join room' }).click();
    await expect(volunteerPage.getByText(/Joining/)).toBeVisible({ timeout: 3000 });

    await instructorPage.close();
    await volunteerPage.close();
    await instructorCtx.close();
    await volunteerCtx.close();
  });
});
