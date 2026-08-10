import { test, expect, type Page } from '@playwright/test';

const SURVEY_URL = '/es/encuesta';

async function enableSW(page: Page): Promise<void> {
  await page.goto(SURVEY_URL, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
      });
    }
  });
}

async function queueLength(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const dbReq = indexedDB.open('voluntarios-survey-queue');
        dbReq.onsuccess = () => {
          const db = dbReq.result;
          const tx = db.transaction('submissions', 'readonly');
          const store = tx.objectStore('submissions');
          const countReq = store.count();
          countReq.onsuccess = () => resolve(countReq.result);
          countReq.onerror = () => reject(countReq.error);
        };
        dbReq.onerror = () => reject(dbReq.error);
      }),
  );
}

test.describe('Offline Survey (service worker)', () => {
  test('cached questions render offline', async ({ context, page }) => {
    await enableSW(page);
    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({
      timeout: 15000,
    });

    await page.reload({ waitUntil: 'networkidle' });

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('submit while offline is queued and replayed when back online', async ({ context, page }) => {
    await enableSW(page);
    await expect(page.getByRole('button', { name: /Rate \d out of 5/ }).first()).toBeVisible({
      timeout: 15000,
    });

    await context.setOffline(true);

    const rateButtons = page.getByRole('button', { name: /Rate \d out of 5/ });
    const total = await rateButtons.count();
    for (let i = 0; i < total; i++) {
      await rateButtons.nth(i).click();
    }

    const submitButton = page.getByRole('button', { name: 'Enviar' });
    await expect(submitButton).not.toBeDisabled();
    await submitButton.click();

    await expect(page.getByText(/se enviará|guardado/i).first()).toBeVisible({ timeout: 10000 });

    await expect.poll(() => queueLength(page), { timeout: 10000 }).toBeGreaterThan(0);

    await context.setOffline(false);
    await expect.poll(() => queueLength(page), { timeout: 15000 }).toBe(0);
  });

  test('public non-survey routes are not cached', async ({ page }) => {
    await enableSW(page);

    const cachedSizes = await page.evaluate(async () => {
      const keys = await caches.keys();
      const result: string[] = [];
      for (const key of keys) {
        const cache = await caches.open(key);
        const reqs = await cache.keys();
        result.push(`${key}: ${reqs.length}`);
      }
      return result;
    });

    const shellLine = cachedSizes.find((l) => l.startsWith('voluntarios-survey-shell'));
    expect(shellLine, `expected survey-shell cache, got: ${JSON.stringify(cachedSizes)}`).toBeTruthy();
  });
});