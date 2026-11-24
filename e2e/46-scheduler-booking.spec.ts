/**
 * KL-E-018 — public scheduler (agendador), browser-only.
 *
 * Covers the audits for fase 2 (public booking) and fase 3 (cancel / reschedule):
 * the visitor drives the real pages and the confirmation e-mail is read from
 * Mailpit (the dev SMTP sink), exactly like a person would read their inbox.
 *
 * Playwright project: `scheduler-review`
 *   pnpm test:e2e:scheduler-review
 *   pnpm test:e2e:scheduler-review:ui
 *
 * Runtime: back with `pnpm local:docker` (SMTP → Mailpit :1025, UI/API :8025),
 * front via the review script (`pnpm build` + `next start`). Never `local:memory`.
 *
 * Booking is limited to 10 POST /api/booking per IP per hour. One full run uses
 * 6; start the back with `RATE_LIMIT_IP=100 pnpm local:docker` to re-run freely.
 *
 * NOT covered here (cannot be seen locally): real Google Calendar events and the
 * 24 h / 1 h reminders (Bull jobs).
 */
import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025';
const TIPO = 'demo';
const BOOKING_PATH = `/reservar/${TIPO}`;

type MailpitSummary = { ID: string; Subject: string; Created: string };
type MailpitMessage = {
  ID: string;
  Subject: string;
  HTML: string;
  Text: string;
  Attachments: Array<{ PartID: string; FileName: string; ContentType: string }>;
};

function uniqueEmail(tag: string): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `sched-${tag}-${Date.now().toString(36)}${rnd}@e2e.shiftcitizen.test`;
}

async function mailsFor(request: APIRequestContext, email: string): Promise<MailpitSummary[]> {
  const res = await request.get(`${MAILPIT}/api/v1/search`, {
    params: { query: `to:"${email}"` },
  });
  expect(res.ok(), 'Mailpit search').toBeTruthy();
  const data = (await res.json()) as { messages?: MailpitSummary[] };
  // A slot closer than 24 h also triggers an immediate "Recordatorio (24h)" mail;
  // these tests only care about confirmations.
  return (data.messages ?? []).filter((m) => m.Subject.startsWith('Confirmación'));
}

/** Wait until `count` mails reached the address, return the newest one in full. */
async function latestMail(
  request: APIRequestContext,
  email: string,
  count = 1,
): Promise<MailpitMessage> {
  await expect
    .poll(async () => (await mailsFor(request, email)).length, {
      message: `confirmation e-mail(s) for ${email}`,
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(count);
  const [newest] = await mailsFor(request, email);
  const res = await request.get(`${MAILPIT}/api/v1/message/${newest.ID}`);
  expect(res.ok(), 'Mailpit message').toBeTruthy();
  return (await res.json()) as MailpitMessage;
}

function linkFromMail(mail: MailpitMessage, kind: 'cancel' | 'reschedule'): string {
  const re = new RegExp(`https?://[^\\s"'<>]*/${kind}\\?[^\\s"'<>]+`);
  const match = re.exec(mail.HTML) ?? re.exec(mail.Text);
  expect(match, `${kind} link in e-mail`).not.toBeNull();
  return (match as RegExpExecArray)[0].replace(/&amp;/g, '&');
}

function dayKeyFromUtc(iso: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

async function selectCalendarDay(
  page: Page,
  dayKey: string,
  calendarTestId = 'booking-calendar',
): Promise<void> {
  const root = page.getByTestId(calendarTestId);
  await expect(root).toBeVisible();
  for (let i = 0; i < 6; i++) {
    const day = root.locator(`button[data-day-key="${dayKey}"]:not([disabled])`);
    if ((await day.count()) > 0) {
      await day.first().click();
      return;
    }
    const next = root.locator('button[aria-label*="Next"], button[name="next-month"]').first();
    if ((await next.count()) === 0) break;
    await next.click();
  }
  throw new Error(`Calendar day ${dayKey} not found or disabled`);
}

async function openBooking(page: Page): Promise<void> {
  await page.goto(BOOKING_PATH);
  await expect(page.getByTestId('booking-page')).toBeVisible();
  await expect(page.getByTestId('booking-calendar')).toBeVisible();
  // First available day is auto-selected → time slots for that day.
  await expect(page.getByTestId('booking-slots')).toBeVisible();
}

function slotRadio(page: Page, startUtc: string) {
  return page.locator(`[data-testid="booking-slot"][data-start-utc="${startUtc}"]`);
}

async function showSlotOnBookingPage(page: Page, startUtc: string) {
  await selectCalendarDay(page, dayKeyFromUtc(startUtc));
  await expect(page.getByTestId('booking-slots')).toBeVisible();
}

/** Pick a random free slot so parallel / repeated runs do not collide. */
async function pickRandomSlot(page: Page): Promise<string> {
  const days = page.locator(
    '[data-testid="booking-calendar"] button[data-day-key]:not([disabled])',
  );
  await expect(days.first()).toBeVisible();
  const dayCount = await days.count();
  await days.nth(Math.floor(Math.random() * dayCount)).click();

  const radios = page.getByTestId('booking-slot');
  await expect(radios.first()).toBeVisible();
  const count = await radios.count();
  const index = Math.floor(Math.random() * count);
  const startUtc = await radios.nth(index).getAttribute('data-start-utc');
  expect(startUtc).toBeTruthy();
  await radios.nth(index).check();
  return startUtc as string;
}

async function fillVisitor(page: Page, name: string, email: string): Promise<void> {
  await page.getByTestId('booking-name').fill(name);
  await page.getByTestId('booking-email').fill(email);
  await page.getByTestId('booking-consent').check();
}

async function bookRandomSlot(page: Page, email: string): Promise<string> {
  await openBooking(page);
  const startUtc = await pickRandomSlot(page);
  await fillVisitor(page, 'Visitante E2E', email);
  await page.getByTestId('booking-submit').click();
  await expect(page.getByTestId('booking-message')).toHaveAttribute('data-status', 'ok');
  return startUtc;
}

async function confirmCancel(page: Page, cancelLink: string): Promise<'ok' | 'error'> {
  await page.goto(cancelLink);
  await expect(page.getByTestId('booking-cancel-page')).toBeVisible();
  await page.getByTestId('booking-cancel-confirm').click();
  const message = page.getByTestId('booking-cancel-message');
  await expect(message).toHaveAttribute('data-status', /^(ok|error)$/);
  return (await message.getAttribute('data-status')) as 'ok' | 'error';
}

/** Best-effort cleanup: free the slot through the newest e-mail's cancel link. */
async function releaseBooking(page: Page, request: APIRequestContext, email: string) {
  try {
    const mail = await latestMail(request, email);
    await confirmCancel(page, linkFromMail(mail, 'cancel'));
  } catch {
    // slot stays booked; the next run just picks another random slot
  }
}

async function visitorContext(browser: Browser) {
  const context = await browser.newContext({ locale: 'es-ES' });
  return { context, page: await context.newPage() };
}

test.describe('KL-E-018 scheduler — public booking, cancel and reschedule', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${MAILPIT}/api/v1/info`).catch(() => null);
    if (!res?.ok()) {
      throw new Error(
        `Mailpit not reachable at ${MAILPIT}. Start the stack (voluntarios-mailpit) and the back with "pnpm local:docker".`,
      );
    }
  });

  test('visitor books a slot and receives the confirmation e-mail with ICS and links', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('book');
    const startUtc = await bookRandomSlot(page, email);
    try {
      await expect(page.getByTestId('booking-message')).toContainText('Reserva confirmada');

      // The booked slot is gone from the public list (same day still open).
      await openBooking(page);
      await showSlotOnBookingPage(page, startUtc);
      await expect(slotRadio(page, startUtc)).toHaveCount(0);

      const mail = await latestMail(request, email);
      expect(mail.Subject).toContain('Confirmación');
      const ics = mail.Attachments.find((a) => a.FileName === 'invite.ics');
      expect(ics, 'invite.ics attachment').toBeTruthy();
      const icsRes = await request.get(
        `${MAILPIT}/api/v1/message/${mail.ID}/part/${(ics as { PartID: string }).PartID}`,
      );
      // RFC 5545 folds long lines (75 octets); unfold before matching.
      const icsBody = (await icsRes.text()).replace(/\r?\n[ \t]/g, '');
      expect(icsBody).toContain('BEGIN:VCALENDAR');
      expect(icsBody).toContain('METHOD:REQUEST');
      expect(icsBody).toContain(email);
      expect(linkFromMail(mail, 'cancel')).toContain(`/reservar/${TIPO}/cancel?`);
      expect(linkFromMail(mail, 'reschedule')).toContain(`/reservar/${TIPO}/reschedule?`);
    } finally {
      await releaseBooking(page, request, email);
    }
  });

  test('cancel link works once, a reused link fails, and the freed slot can be rebooked', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('cancel');
    const startUtc = await bookRandomSlot(page, email);
    const rebookEmail = uniqueEmail('rebook');
    let rebooked = false;
    try {
      const cancelLink = linkFromMail(await latestMail(request, email), 'cancel');

      expect(await confirmCancel(page, cancelLink)).toBe('ok');
      await expect(page.getByTestId('booking-cancel-message')).toContainText('Reserva cancelada');

      // Same link a second time: single-use token.
      expect(await confirmCancel(page, cancelLink)).toBe('error');
      await expect(page.getByTestId('booking-cancel-message')).toContainText('No se pudo cancelar');

      // The slot is public again and a different visitor can take it.
      await openBooking(page);
      await showSlotOnBookingPage(page, startUtc);
      await expect(slotRadio(page, startUtc)).toHaveCount(1);
      await slotRadio(page, startUtc).check();
      await fillVisitor(page, 'Otra persona E2E', rebookEmail);
      await page.getByTestId('booking-submit').click();
      await expect(page.getByTestId('booking-message')).toHaveAttribute('data-status', 'ok');
      rebooked = true;
    } finally {
      if (rebooked) await releaseBooking(page, request, rebookEmail);
    }
  });

  test('cancel page rejects an invalid token', async ({ page }) => {
    expect(await confirmCancel(page, `${BOOKING_PATH}/cancel?id=nope&token=not-a-real-token`)).toBe(
      'error',
    );
    await expect(page.getByTestId('booking-cancel-message')).toContainText('No se pudo cancelar');
  });

  test('reschedule moves the booking, frees the old slot and invalidates the old links', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('resched');
    const oldStart = await bookRandomSlot(page, email);
    try {
      const firstMail = await latestMail(request, email);
      const oldCancelLink = linkFromMail(firstMail, 'cancel');

      await page.goto(linkFromMail(firstMail, 'reschedule'));
      await expect(page.getByTestId('booking-reschedule-page')).toBeVisible();
      await expect(page.getByTestId('booking-reschedule-calendar')).toBeVisible();

      const days = page.locator(
        '[data-testid="booking-reschedule-calendar"] button[data-day-key]:not([disabled])',
      );
      await expect(days.first()).toBeVisible();
      // Prefer a day that is not the old booking's day when possible.
      const oldDay = dayKeyFromUtc(oldStart);
      const dayCount = await days.count();
      let pickedDay = false;
      for (let i = 0; i < dayCount; i++) {
        const key = await days.nth(i).getAttribute('data-day-key');
        if (key && key !== oldDay) {
          await days.nth(i).click();
          pickedDay = true;
          break;
        }
      }
      if (!pickedDay) await days.first().click();

      const options = page.locator(
        `[data-testid="booking-reschedule-slot"]:not([data-start-utc="${oldStart}"])`,
      );
      await expect(options.first()).toBeVisible();
      const optionCount = await options.count();
      const newStart = await options
        .nth(Math.floor(Math.random() * optionCount))
        .getAttribute('data-start-utc');
      expect(newStart).toBeTruthy();
      await page
        .locator(`[data-testid="booking-reschedule-slot"][data-start-utc="${newStart}"]`)
        .click();
      await expect(page.getByTestId('booking-reschedule-message')).toHaveAttribute(
        'data-status',
        'ok',
      );
      await expect(page.getByTestId('booking-reschedule-message')).toContainText('reprogramada');

      // A second e-mail with fresh links arrives.
      const secondMail = await latestMail(request, email, 2);
      expect(linkFromMail(secondMail, 'cancel')).not.toBe(oldCancelLink);

      // Old cancel link must not touch the rescheduled booking.
      expect(await confirmCancel(page, oldCancelLink)).toBe('error');

      // Old slot is bookable again, the new one is taken.
      await openBooking(page);
      await showSlotOnBookingPage(page, oldStart);
      await expect(slotRadio(page, oldStart)).toHaveCount(1);
      await showSlotOnBookingPage(page, newStart as string);
      await expect(slotRadio(page, newStart as string)).toHaveCount(0);
    } finally {
      await releaseBooking(page, request, email);
    }
  });

  test('two visitors race for the same slot: exactly one wins', async ({ browser, request }) => {
    const first = await visitorContext(browser);
    const second = await visitorContext(browser);
    const emailA = uniqueEmail('raceA');
    const emailB = uniqueEmail('raceB');
    try {
      await openBooking(first.page);
      await openBooking(second.page);
      const startUtc = await pickRandomSlot(first.page);
      await showSlotOnBookingPage(second.page, startUtc);
      await expect(slotRadio(second.page, startUtc)).toHaveCount(1);
      await slotRadio(second.page, startUtc).check();
      await fillVisitor(first.page, 'Visitante A', emailA);
      await fillVisitor(second.page, 'Visitante B', emailB);

      await Promise.all([
        first.page.getByTestId('booking-submit').click(),
        second.page.getByTestId('booking-submit').click(),
      ]);

      const statuses: string[] = [];
      let loserMessage = '';
      for (const { page } of [first, second]) {
        const message = page.getByTestId('booking-message');
        await expect(message).toHaveAttribute('data-status', /^(ok|error)$/, { timeout: 15_000 });
        const status = (await message.getAttribute('data-status')) as string;
        statuses.push(status);
        if (status === 'error') {
          loserMessage = (await message.textContent()) ?? '';
        }
      }
      expect(statuses.sort()).toEqual(['error', 'ok']);
      expect(loserMessage).toMatch(/otra persona/i);
      expect(loserMessage).not.toContain('slot_conflict');

      const winner =
        (await first.page.getByTestId('booking-message').getAttribute('data-status')) === 'ok'
          ? { email: emailA, page: first.page }
          : { email: emailB, page: second.page };
      await releaseBooking(winner.page, request, winner.email);
    } finally {
      await first.context.close();
      await second.context.close();
    }
  });
});
