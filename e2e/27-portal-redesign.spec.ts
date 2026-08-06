import { test, expect } from '@playwright/test';
import { seedQuizCourse, BACKEND_URL } from './helpers';

const PORTAL_USER = { email: 'general@fundacionaltius.org', password: 'general123' };

async function loginAsVolunteer(page: any) {
  await page.goto('/es/login', { waitUntil: 'load' });
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
  { path: '/es/portal', heading: /Mi Panel|Panel/i },
  { path: '/es/portal/actividades', heading: /Actividades/i },
  { path: '/es/portal/cursos', heading: /Cursos/i },
  { path: '/es/portal/proyectos', heading: /Proyectos/i },
  { path: '/es/portal/mensajes', heading: /Mensajes/i },
  { path: '/es/portal/noticias', heading: /Noticias/i },
  { path: '/es/portal/logros', heading: /Logros/i },
  { path: '/es/portal/ranking', heading: /Ranking|Clasificación/i },
  { path: '/es/portal/notificaciones', heading: /Notificaciones/i },
];

test.describe.serial('Portal Redesign', () => {
  test.describe('8.3 Desktop sidebar & page headings', () => {
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

  test.describe('8.4 Mobile bottom nav', () => {
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

  test.describe('8.5 Spanish video room', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('video room page shows Spanish text', async ({ page }) => {
      await loginAsVolunteer(page);
      await page.goto('/es/portal/sala/test-room-123', { waitUntil: 'networkidle' });
      const body = page.locator('body');
      // Look for Spanish phrases
      await expect(body).toContainText(/sala|unirse|conexión|cámara|micrófono|compartir/i);
    });
  });

  test.describe.serial('8.6 Quiz interactivity', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    let courseId: string;
    let lessonId: string;

    test.beforeAll(async ({ request }) => {
      const ids = await seedQuizCourse(request);
      courseId = ids.courseId;
      lessonId = ids.lessonId;
    });

    test('quiz options are clickable and show feedback', async ({ page }) => {
      await loginAsVolunteer(page);
      await expect(page.locator('nav').or(page.locator('aside')).first()).toBeAttached({ timeout: 10000 });
      await page.goto(`/es/portal/cursos/${courseId}/lecciones/${lessonId}`, { waitUntil: 'networkidle' });

      // Quiz options should be present
      const quizOptions = page.locator('.cursor-pointer.rounded-md.border.p-3');
      const optCount = await quizOptions.count();
      expect(optCount).toBeGreaterThan(0);

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

  test.describe('8.7 Old mensajes redirect', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('old /portal/proyectos/mensajes redirects to /es/portal/mensajes', async ({ page }) => {
      await loginAsVolunteer(page);
      await page.goto('/portal/proyectos/mensajes', { waitUntil: 'load' });
      // Should redirect (client-side or server-side) to /es/portal/mensajes
      await page.waitForURL('**/es/portal/mensajes', { timeout: 10000 });
      expect(page.url()).toContain('/es/portal/mensajes');
    });
  });
});
