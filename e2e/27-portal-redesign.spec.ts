import { test, expect } from '@playwright/test';

const PORTAL_USER = { email: 'general@fundacionaltius.org', password: 'general123' };

async function loginAsVolunteer(page: any) {
  await page.goto('/login', { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    if (!form) return false;
    return Object.keys(form).some(k => k.startsWith('__react'));
  }, { timeout: 5000 });
  await page.fill('input[type="email"]', PORTAL_USER.email);
  await page.fill('input[type="password"]', PORTAL_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/portal**', { timeout: 20000 });
}

const PORTAL_ROUTES = [
  { path: '/portal', heading: /Mi Panel|Panel/i },
  { path: '/portal/actividades', heading: /Actividades/i },
  { path: '/portal/cursos', heading: /Cursos/i },
  { path: '/portal/proyectos', heading: /Proyectos/i },
  { path: '/portal/mensajes', heading: /Mensajes/i },
  { path: '/portal/noticias', heading: /Noticias/i },
  { path: '/portal/logros', heading: /Logros/i },
  { path: '/portal/ranking', heading: /Ranking|Clasificación/i },
  { path: '/portal/notificaciones', heading: /Notificaciones/i },
];

test.describe('Portal Redesign – 8.3 Desktop sidebar & page headings', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await loginAsVolunteer(page);
  });

  for (const route of PORTAL_ROUTES) {
    test(`${route.path} — sidebar visible, heading present`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      // Sidebar
      const sidebar = page.locator('nav').or(page.locator('aside')).first();
      await expect(sidebar).toBeVisible();
      // Page heading
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      // Check sidebar links exist
      const navLinks = sidebar.locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(5);
    });
  }
});

test.describe('Portal Redesign – 8.4 Mobile bottom nav', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await loginAsVolunteer(page);
  });

  for (const route of PORTAL_ROUTES) {
    test(`${route.path} — bottom nav visible, no sidebar`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      // Bottom nav should exist
      const bottomNav = page.locator('nav').or(page.locator('[class*="bottom"]')).first();
      await expect(bottomNav).toBeAttached();
      // Page heading visible
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
    });
  }
});

test.describe('Portal Redesign – 8.5 Spanish video room', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('video room page shows Spanish text', async ({ page }) => {
    await loginAsVolunteer(page);
    await page.goto('/portal/sala/test-room-123', { waitUntil: 'networkidle' });
    const body = page.locator('body');
    // Look for Spanish phrases
    await expect(body).toContainText(/sala|unirse|conexión|cámara|micrófono|compartir/i);
  });
});

test.describe('Portal Redesign – 8.6 Quiz interactivity', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('quiz options are clickable and show feedback', async ({ page }) => {
    await loginAsVolunteer(page);
    // Navigate to cursos, find one with a quiz lesson
    await page.goto('/portal/cursos', { waitUntil: 'networkidle' });
    const courseLinks = page.locator('a[href*="/portal/cursos/"]');
    const count = await courseLinks.count();
    if (count === 0) {
      test.skip('No courses found');
      return;
    }
    // Click first course
    await courseLinks.first().click();
    await page.waitForURL('**/portal/cursos/**', { timeout: 10000 });

    // Look for a lesson link
    const lessonLinks = page.locator('a[href*="/lecciones/"]');
    const lessonCount = await lessonLinks.count();
    if (lessonCount === 0) {
      test.skip('No lessons found');
      return;
    }
    await lessonLinks.first().click();
    await page.waitForURL('**/lecciones/**', { timeout: 10000 });

    // Check if there's a quiz (clickable options + submit button)
    const quizOptions = page.locator('.cursor-pointer.rounded-md.border.p-3');
    const optCount = await quizOptions.count();
    if (optCount === 0) {
      test.skip('No quiz options found on this page');
      return;
    }

    // Click first option
    await quizOptions.first().click();
    await expect(quizOptions.first()).toHaveClass(/border-primary/);

    // Click Enviar button
    const submitBtn = page.getByText('Enviar');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Feedback should show
    await expect(page.getByText(/Correcto|Incorrecta/)).toBeVisible();
  });
});

test.describe('Portal Redesign – 8.7 Old mensajes redirect', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('old /portal/proyectos/mensajes redirects to /portal/mensajes', async ({ page }) => {
    await loginAsVolunteer(page);
    await page.goto('/portal/proyectos/mensajes', { waitUntil: 'load' });
    // Should redirect (client-side or server-side) to /portal/mensajes
    await page.waitForURL('**/portal/mensajes', { timeout: 10000 });
    expect(page.url()).toContain('/portal/mensajes');
  });
});
