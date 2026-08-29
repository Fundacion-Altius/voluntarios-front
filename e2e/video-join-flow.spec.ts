import { test, expect } from '@playwright/test';
import { adminLogin, authHeaders, BACKEND_URL } from './helpers';

const FAKE_ROOM = '11111111-1111-1111-1111-111111111111';

test.describe('Video join flow UX', () => {
  test('unauthenticated room page shows disabled join and login link', async ({ page }) => {
    await page.goto(`/es/portal/sala/${FAKE_ROOM}`, { waitUntil: 'domcontentloaded' });
    const joinBtn = page.getByRole('button', { name: /Unirse a la sala/i });
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    await expect(joinBtn).toBeDisabled();
    await expect(page.getByText('Debes iniciar sesión')).toBeVisible();
    const loginLink = page.getByRole('link', { name: /Iniciar sesión/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', /\/es\/login/);
  });

  test('activities page disables join when no live room exists', async ({ page }) => {
    await page.route('**/api/activities/upcoming**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'sess-no-room',
            shift: 'Turno test',
            capacity: 5,
            date: '2026-08-29',
            is_cancelled: 'false',
          },
        ]),
      });
    });
    await page.route('**/api/video/rooms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/es/portal/actividades', { waitUntil: 'domcontentloaded' });
    const joinBtn = page.getByRole('button', { name: /Unirse a clase en vivo/i });
    await expect(joinBtn).toBeVisible({ timeout: 15000 });
    await expect(joinBtn).toBeDisabled();
    await expect(page.getByText('No hay una sala activa para esta actividad')).toBeVisible();
  });

  test('role toggle changes variant and host is stored on created room', async ({ page, request }) => {
    await page.goto(`/es/portal/sala/${FAKE_ROOM}`, { waitUntil: 'domcontentloaded' });
    const hostToggle = page.getByRole('button', { name: /Unirse como anfitrión/i });
    const guestToggle = page.getByRole('button', { name: /Unirse como participante/i });
    await expect(guestToggle).toBeVisible({ timeout: 10000 });
    await expect(guestToggle).toHaveClass(/bg-secondary|secondary/);
    await hostToggle.click();
    await expect(hostToggle).toHaveClass(/bg-secondary|secondary/);

    const { authToken, csrfToken } = await adminLogin(request);
    const roomRes = await request.fetch(`${BACKEND_URL}/api/video/rooms`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: { contextType: 'community', contextId: 'proj1', participantUserIds: [] },
    });
    expect(roomRes.ok()).toBeTruthy();
    const roomBody = await roomRes.json();
    const roomId = roomBody.data?.roomId as string;
    expect(roomId).toBeTruthy();

    const getRes = await request.fetch(`${BACKEND_URL}/api/video/rooms/${roomId}`, {
      headers: authHeaders(authToken, csrfToken),
    });
    expect(getRes.ok()).toBeTruthy();
    const getBody = await getRes.json();
    const participants = getBody.data?.participants ?? [];
    expect(participants.some((p: { role?: string }) => p.role === 'host')).toBeTruthy();
  });
});
