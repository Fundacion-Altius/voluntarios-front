import { test, expect } from '@playwright/test';

test('login flow diagnostic', async ({ page, context }) => {
  const backendRequests: string[] = [];
  const responses: { url: string; status: number; body?: any }[] = [];

  await page.route('http://localhost:3001/**', (route) => {
    backendRequests.push(`${route.request().method()} ${route.request().url()}`);
    route.continue();
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('localhost:3001')) {
      const body = await response.text().catch(() => '(no body)');
      responses.push({
        url,
        status: response.status(),
        body: body.substring(0, 1000),
      });
    }
  });

  page.on('console', (msg) => {
    console.log(`[console.${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`);
  });

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Wait for React hydration
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    if (!form) return false;
    return Object.keys(form).some(k => k.startsWith('__react'));
  }, { timeout: 5000 });

  console.log('\n=== FILLING FORM ===');
  await page.fill('input[type="email"]', 'admin@fundacionaltius.org');
  await page.fill('input[type="password"]', 'admin123');

  console.log('=== SUBMITTING ===');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(5000);

  console.log('\n=== PAGE URL ===');
  console.log(page.url());

  console.log('\n=== BACKEND REQUESTS ===');
  for (const r of backendRequests) {
    console.log(`  ${r}`);
  }

  console.log('\n=== ALL BACKEND RESPONSES ===');
  for (const r of responses) {
    console.log(`\n${r.url}`);
    console.log(`  Status: ${r.status}`);
    console.log(`  Body: ${r.body}`);
  }

  console.log('\n=== COOKIES ===');
  const cookies = await context.cookies();
  for (const c of cookies) {
    console.log(`${c.name}: ${c.value.substring(0, 50)}... domain=${c.domain} path=${c.path}`);
  }

  expect(backendRequests.length).toBeGreaterThan(0);
  expect(cookies.find(c => c.name === 'auth_token')).toBeDefined();
  expect(cookies.find(c => c.name === 'next-auth.session-token')).toBeDefined();
});
