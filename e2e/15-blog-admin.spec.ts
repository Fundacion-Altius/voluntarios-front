import { test, expect } from '@playwright/test';
import { loginAsBrowser, BACKEND_URL } from './helpers';

const TEST_SLUG = `e2e-admin-post-${Date.now()}`;
const ADMIN_CREDS = { email: 'admin@fundacionaltius.org', password: 'admin123' };

test.describe('Admin Blog Editor', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  let authToken: string;
  let csrfToken: string;

  test.beforeAll(async ({ playwright }) => {
    const api = await playwright.request.newContext();
    const loginRes = await api.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST', data: ADMIN_CREDS,
    });
    const body = await loginRes.json();
    authToken = body.authToken;
    csrfToken = body.csrfToken;
    await api.dispose();
  });

  test('blog page renders and lists posts', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/es/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Admin Panel', { timeout: 15000 });
    await page.locator('a', { hasText: 'Blog' }).click();
    await page.waitForURL('**/admin/blog', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Blog', { timeout: 15000 });
  });

  test('full CRUD cycle: create, list, publish, delete', async ({ page }) => {
    // Use page.request so cookies (including csrf_token) are shared with browser context
    const api = page.request;

    // Fetch CSRF token via page.request to ensure the cookie is set in the browser context
    const csrfResp = await api.fetch(`${BACKEND_URL}/api/csrf-token`, { method: 'GET' });
    const browserCsrf = (await csrfResp.json()).csrfToken;

    const hdrs = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-CSRF-Token': browserCsrf,
    };

    // -- CREATE CATEGORY (if needed) --
    const catRes = await api.fetch(`${BACKEND_URL}/api/blog/categories`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const categories = await catRes.json();
    const cats = Array.isArray(categories) ? categories : categories.data || [];
    let categoryId = cats[0]?.id;
    if (!categoryId) {
      const newCat = await api.fetch(`${BACKEND_URL}/api/blog/categories`, {
        method: 'POST', headers: hdrs,
        data: { name: 'General', slug: `general-${Date.now()}` },
      });
      const catBody = await newCat.json();
      categoryId = catBody.id || catBody.data?.id;
      if (!categoryId) throw new Error(`Category creation returned no id: ${JSON.stringify(catBody)}`);
    }

    // -- CREATE POST --
    const createRes = await api.fetch(`${BACKEND_URL}/api/blog/posts`, {
      method: 'POST', headers: hdrs,
      data: {
        title: 'E2E Admin Post', slug: TEST_SLUG,
        excerpt: 'Created during E2E test',
        body: 'Full body content for E2E test post.',
        category_id: categoryId,
        published_at: new Date().toISOString(),
      },
    });
    if (!createRes.ok()) {
      throw new Error(`Blog post creation failed (${createRes.status()}): ${await createRes.text()}`);
    }

    // -- LIST & VERIFY --
    const listRes = await api.fetch(`${BACKEND_URL}/api/blog/posts?status=all&pageSize=100`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const listBody = await listRes.json();
    const posts = listBody.data || [];
    const createdPost = posts.find((p: any) => p.slug === TEST_SLUG);
    expect(createdPost).toBeDefined();

    // -- UNPUBLISH --
    const unpubRes = await api.fetch(`${BACKEND_URL}/api/blog/posts/${createdPost.id}`, {
      method: 'PUT', headers: hdrs,
      data: { published_at: null },
    });
    expect(unpubRes.ok()).toBeTruthy();

    // -- DELETE --
    const delRes = await api.fetch(`${BACKEND_URL}/api/blog/posts/${createdPost.id}`, {
      method: 'DELETE', headers: hdrs,
    });
    expect(delRes.ok()).toBeTruthy();
  });
});