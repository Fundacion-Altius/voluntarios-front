import { test, expect } from '@playwright/test';
import { loginAsBrowser, adminLogin, BACKEND_URL, authHeaders } from './helpers';

test.describe.serial('Portal Blog Feed', () => {
  let blogPostSlug: string;

  test.beforeAll(async ({ request }) => {
    // Ensure a published blog post exists for the "portal home" test
    const { authToken, csrfToken } = await adminLogin(request);
    const catRes = await request.fetch(`${BACKEND_URL}/api/blog/categories`, {
      headers: authHeaders(authToken, csrfToken),
    });
    const categories = await catRes.json();
    const categoryId = categories[0]?.id;
    blogPostSlug = `e2e-portal-home-${Date.now()}`;
    await request.fetch(`${BACKEND_URL}/api/blog/posts`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: {
        title: 'E2E Portal Home Post',
        slug: blogPostSlug,
        excerpt: 'Extracto para portal home',
        body: 'Contenido completo.',
        image_url: null,
        category_id: categoryId,
        published_at: new Date().toISOString(),
      },
    });
  });

  test('portal home shows recent news section', async ({ page }) => {
    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('Últimas noticias', { timeout: 15000 });
  });

  test('noticias page shows published post', async ({ page, request }) => {
    const slug = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { authToken, csrfToken } = await adminLogin(request);
    const catRes = await request.fetch(`${BACKEND_URL}/api/blog/categories`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    const categories = await catRes.json();
    const categoryId = categories[0]?.id;
    const postRes = await request.fetch(`${BACKEND_URL}/api/blog/posts`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: {
        title: 'E2E Noticia de prueba',
        slug,
        excerpt: 'Extracto de prueba',
        body: 'Contenido completo.',
        image_url: null,
        category_id: categoryId,
        published_at: new Date().toISOString(),
      },
    });
    expect(postRes.ok()).toBeTruthy();

    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal/noticias', { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('E2E Noticia de prueba', { timeout: 15000 });
  });

  test('noticias post detail page shows full content', async ({ page, request }) => {
    const slug = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { authToken, csrfToken } = await adminLogin(request);
    const catRes = await request.fetch(`${BACKEND_URL}/api/blog/categories`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    const categories = await catRes.json();
    const categoryId = categories[0]?.id;
    const postRes = await request.fetch(`${BACKEND_URL}/api/blog/posts`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: {
        title: 'E2E Detalle noticia',
        slug,
        excerpt: 'Extracto',
        body: 'Contenido completo del detalle.',
        image_url: null,
        category_id: categoryId,
        published_at: new Date().toISOString(),
      },
    });
    expect(postRes.ok()).toBeTruthy();

    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto(`/portal/noticias/${slug}`, { waitUntil: 'load' });
    await expect(page.locator('body')).toContainText('E2E Detalle noticia', { timeout: 15000 });
    await expect(page.locator('body')).toContainText('Contenido completo del detalle.', { timeout: 15000 });
  });

  test('clicking a post card navigates to detail', async ({ page, request }) => {
    const slug = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { authToken, csrfToken } = await adminLogin(request);
    const catRes = await request.fetch(`${BACKEND_URL}/api/blog/categories`, {
      method: 'GET',
      headers: authHeaders(authToken, csrfToken),
    });
    const categories = await catRes.json();
    const categoryId = categories[0]?.id;
    const postRes = await request.fetch(`${BACKEND_URL}/api/blog/posts`, {
      method: 'POST',
      headers: { ...authHeaders(authToken, csrfToken), 'Content-Type': 'application/json' },
      data: {
        title: 'E2E Card noticia',
        slug,
        excerpt: 'Extracto',
        body: 'Contenido.',
        image_url: null,
        category_id: categoryId,
        published_at: new Date().toISOString(),
      },
    });
    expect(postRes.ok()).toBeTruthy();

    await loginAsBrowser(page, 'general@fundacionaltius.org', 'general123');
    await page.goto('/portal/noticias', { waitUntil: 'load' });

    const postLink = page.locator(`a[href="/portal/noticias/${slug}"]`).first();
    await expect(postLink).toBeVisible({ timeout: 15000 });
    await postLink.click();
    await page.waitForURL(`**/portal/noticias/${slug}`, { timeout: 10000 });
    await expect(page.locator('body')).toContainText('E2E Card noticia');
  });
});
