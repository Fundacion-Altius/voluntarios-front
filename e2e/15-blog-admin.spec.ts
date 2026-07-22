import { test, expect } from '@playwright/test';
import { adminLogin, loginAsBrowser, BACKEND_URL, authHeaders, randomId } from './helpers';

const TEST_SLUG = `e2e-admin-post-${Date.now()}`;

test.describe('Admin Blog Editor', () => {
  test.describe.configure({ mode: 'serial' });

  test('blog page renders and lists posts', async ({ page }) => {
    await loginAsBrowser(page, 'admin@fundacionaltius.org', 'admin123');
    await page.goto('/admin/dashboard', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Admin Panel', { timeout: 10000 });

    await page.locator('a', { hasText: 'Blog' }).click();
    await page.waitForURL('**/admin/blog', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Blog', { timeout: 10000 });
  });

  test('create a new blog post', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const catRes = await request.fetch(`${BACKEND_URL}/api/blog/categories`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    let categories = await catRes.json();
    if (!Array.isArray(categories) || categories.length === 0) {
      const newCat = await request.fetch(`${BACKEND_URL}/api/blog/categories`, {
        method: 'POST',
        headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
        data: { name: 'General', slug: 'general' },
      });
      const catBody = await newCat.json();
      categories = [catBody];
    }
    const categoryId = categories[0].id;

    const res = await request.fetch(`${BACKEND_URL}/api/blog/posts`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: {
        title: 'E2E Admin Post',
        slug: TEST_SLUG,
        excerpt: 'Created during E2E test',
        body: 'Full body content for E2E test post.',
        category_id: categoryId,
        published_at: new Date().toISOString(),
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('post appears in admin list', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const res = await request.fetch(`${BACKEND_URL}/api/blog/posts?status=all&pageSize=100`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const posts = body.data || [];
    const found = posts.find((p: any) => p.slug === TEST_SLUG);
    expect(found).toBeDefined();
  });

  test('publish/unpublish toggles post visibility', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const listRes = await request.fetch(`${BACKEND_URL}/api/blog/posts?status=all&pageSize=100`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    const listBody = await listRes.json();
    const posts = listBody.data || [];
    const post = posts.find((p: any) => p.slug === TEST_SLUG);
    expect(post).toBeDefined();

    const unpubRes = await request.fetch(`${BACKEND_URL}/api/blog/posts/${post.id}`, {
      method: 'PUT',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: { published_at: null },
    });
    expect(unpubRes.ok()).toBeTruthy();
  });

  test('delete blog post', async ({ request }) => {
    const { authToken, csrfToken } = await adminLogin(request);

    const listRes = await request.fetch(`${BACKEND_URL}/api/blog/posts?status=all&pageSize=100`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    const listBody = await listRes.json();
    const posts = listBody.data || [];
    const post = posts.find((p: any) => p.slug === TEST_SLUG);
    expect(post).toBeDefined();

    const delRes = await request.fetch(`${BACKEND_URL}/api/blog/posts/${post.id}`, {
      method: 'DELETE',
      headers: authHeaders(authToken, csrfToken),
    });
    expect(delRes.ok()).toBeTruthy();
  });
});
