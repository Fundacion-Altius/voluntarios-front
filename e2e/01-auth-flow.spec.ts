import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('login page loads and shows sign in button', async ({ page }) => {
    await page.goto('/es/login', { waitUntil: 'load' });
    await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
  });

  test('admin dashboard redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
    await page.waitForURL('**/login', { timeout: 15000 });
    await expect(page.getByText('Accede con tu cuenta de Fundación Altius')).toBeVisible();
  });

  test('credentials login sets auth cookie and redirects to admin dashboard', async ({ page, context }) => {
    await page.goto('/es/login', { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      return Object.keys(form).some((k) => k.startsWith('__react'));
    }, { timeout: 5000 });

    await page.fill('input[type="email"]', 'admin@fundacionaltius.org');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/dashboard', { timeout: 20000 });

    // Upstream API session cookie (via /api/auth/login → copyUpstreamCookies).
    await expect
      .poll(async () => (await context.cookies()).some((c) => c.name === 'auth_token'), {
        timeout: 10000,
      })
      .toBe(true);

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'auth_token');
    expect(authCookie).toBeDefined();

    // NextAuth still sets HttpOnly csrf + callback cookies on this path.
    const nextAuthCsrf = cookies.find((c) => c.name === 'next-auth.csrf-token');
    expect(nextAuthCsrf).toBeDefined();
    expect(nextAuthCsrf!.httpOnly).toBe(true);

    const nextAuthCallback = cookies.find((c) => c.name === 'next-auth.callback-url');
    expect(nextAuthCallback).toBeDefined();
    expect(nextAuthCallback!.httpOnly).toBe(true);

    // session-token may appear after settle; if present it must be HttpOnly.
    const sessionCookie = cookies.find((c) => c.name === 'next-auth.session-token');
    if (sessionCookie) {
      expect(sessionCookie.httpOnly).toBe(true);
    }
  });
});
