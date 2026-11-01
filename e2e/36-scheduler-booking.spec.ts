/**
 * KL-E-018 Agendador — public booking e2e (Carlos functional gate).
 * Requires: docker compose up + back `pnpm local:docker` on :3001
 * (`BOOKING_RETURN_CANCEL_TOKEN=1` is set by that script for cancel-token e2e).
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import { BACKEND_URL, randomId } from './helpers';

test.describe('@persona:public @flag:scheduler Scheduler public booking', () => {
  test('loads /reservar/demo with attribution query', async ({ page }) => {
    const res = await page.goto('/es/reservar/demo?ref=linkedin-adela', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByTestId('booking-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Reservar — demo/i })).toBeVisible();
    // Slots or empty state from API
    await expect(
      page.getByTestId('booking-slots').or(page.getByTestId('booking-no-slots')),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('API rejects honeypot when website is filled', async () => {
    const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    const slotsRes = await api.get('/api/booking/slots?tipo=demo');
    expect(slotsRes.ok()).toBeTruthy();
    const { slots } = (await slotsRes.json()) as { slots: Array<{ startUtc: string; endUtc: string }> };
    if (!slots?.length) {
      test.skip(true, 'No API slots — skip honeypot');
    }
    const slot = slots[0];
    const res = await api.post('/api/booking', {
      data: {
        tipo: 'demo',
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        visitorTz: 'Europe/Madrid',
        visitorEmail: `bot-${randomId('e2e')}@example.com`,
        visitorName: 'Bot',
        consent: true,
        website: 'https://spam.example',
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('honeypot');
    await api.dispose();
  });

  test('books a free slot via UI when slots exist', async ({ page }) => {
    await page.goto('/es/reservar/demo?ref=linkedin-adela&utm_source=e2e', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('booking-page')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByTestId('booking-slots').or(page.getByTestId('booking-no-slots')),
    ).toBeVisible({ timeout: 15_000 });

    if (await page.getByTestId('booking-no-slots').isVisible().catch(() => false)) {
      test.skip(true, 'No slots available — skip UI book');
    }

    await page.locator('input[name="slot"]').first().check();
    const email = `ada-${randomId('e2e')}@example.com`;
    await page.getByTestId('booking-name').fill('Ada E2E');
    await page.getByTestId('booking-email').fill(email);
    await page.getByTestId('booking-consent').check();
    await page.getByTestId('booking-submit').click();

    await expect(page.getByTestId('booking-message')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('booking-message')).toHaveAttribute('data-status', 'ok');
    await expect(page.getByTestId('booking-message')).toContainText(/confirmada/i);
  });

  test('API: book → cancel once → second cancel 403', async () => {
    const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    const slotsRes = await api.get('/api/booking/slots?tipo=demo');
    expect(slotsRes.ok(), `slots HTTP ${slotsRes.status()}`).toBeTruthy();
    const { slots } = (await slotsRes.json()) as { slots: Array<{ startUtc: string; endUtc: string }> };
    if (!slots?.length) {
      test.skip(true, 'No API slots — skip cancel chain');
    }

    const slot = slots[0];
    const createRes = await api.post('/api/booking', {
      data: {
        tipo: 'demo',
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        visitorTz: 'Europe/Madrid',
        visitorEmail: `cancel-${randomId('e2e')}@example.com`,
        visitorName: 'Cancel E2E',
        consent: true,
        ref: 'linkedin-adela',
        website: '',
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const body = (await createRes.json()) as {
      booking: { id: string; ref: string | null };
      cancelToken?: string;
    };
    expect(body.booking.ref).toBe('linkedin-adela');
    expect(body.cancelToken, 'cancelToken required in development for e2e').toBeTruthy();

    const first = await api.post('/api/booking/cancel', { data: { token: body.cancelToken } });
    expect(first.status()).toBe(200);

    const second = await api.post('/api/booking/cancel', { data: { token: body.cancelToken } });
    expect(second.status()).toBe(403);

    await api.dispose();
  });

  test('cancel page shows confirmation UI with token', async ({ page }) => {
    await page.goto(`/es/reservar/demo/cancel?token=${'a'.repeat(64)}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('booking-cancel-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Cancelar reserva/i })).toBeVisible();
    await expect(page.getByTestId('booking-cancel-confirm')).toBeEnabled();
  });
});
