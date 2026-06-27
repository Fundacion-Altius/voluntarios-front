import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('login page loads and shows sign in button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
  });

  test('dashboard redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForURL('**/login', { timeout: 15000 });
    await expect(page.getByText('Accede con tu cuenta de Fundación Altius')).toBeVisible();
  });

  test('credentials login sets auth cookie', async ({ page, context }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Wait for React hydration before interacting with the form
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      return Object.keys(form).some(k => k.startsWith('__react'));
    }, { timeout: 5000 });

    await page.fill('input[type="email"]', 'admin@fundacionaltius.org');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // After successful login, the page should navigate to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Check that auth cookies are set
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    expect(authCookie).toBeDefined();
    expect(authCookie?.httpOnly).toBe(true);
  });
});
