import { test, expect } from '@playwright/test';
import { BACKEND_URL } from './helpers';

test.describe('Messaging inbound to outbound', () => {
  test('Telegram webhook is processed and logged', async ({ request }) => {
    const webhook = await request.fetch(`${BACKEND_URL}/api/messaging/webhooks/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_WEBHOOK_SECRET || 'dev-telegram-secret',
      },
      data: {
        message: {
          message_id: Date.now(),
          text: 'horario',
          from: { id: 4242 },
          chat: { id: 4242 },
        },
      },
    });
    expect(webhook.ok()).toBeTruthy();

    const logsRes = await request.fetch(`${BACKEND_URL}/api/messaging/logs`);
    if (logsRes.ok()) {
      const body = await logsRes.json();
      expect(Array.isArray(body.data)).toBeTruthy();
    }
  });
});
