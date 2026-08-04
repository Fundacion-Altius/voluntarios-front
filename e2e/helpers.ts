import { request as playwrightRequest, type Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

export const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

export function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Authenticate in the browser context by calling NextAuth's internal
 * credentials endpoint via the Playwright request fixture, extracting the
 * session cookie from Set-Cookie, and injecting it into the browser page.
 * This avoids the race condition between signIn() and SessionProvider.
 */
export async function loginAsBrowser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const csrfRes = await page.request.get(`${FRONTEND_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  const authRes = await page.request.post(
    `${FRONTEND_URL}/api/auth/callback/credentials`,
    {
      form: { csrfToken, email, password, json: 'true' },
    },
  );

  const raw = authRes.headers()['set-cookie'] || '';
  const match = raw.match(/next-auth\.session-token=([^;]+)/);
  if (!match) {
    throw new Error(
      `Failed to extract next-auth.session-token from Set-Cookie: ${raw}`,
    );
  }

  const cookies: { name: string; value: string; domain: string; path: string }[] = [
    {
      name: 'next-auth.session-token',
      value: match[1],
      domain: 'localhost',
      path: '/',
    },
  ];

  let backendRes: Awaited<ReturnType<typeof page.request.post>> | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      backendRes = await page.request.post(`${BACKEND_URL}/api/auth/login`, {
        data: { email, password },
      });
      if (backendRes.ok()) break;
    } catch {
      // transient ECONNRESET under parallel worker load; retry
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000));
  }
  if (backendRes?.ok()) {
    const backendData = await backendRes.json();
    if (backendData.authToken) {
      cookies.push({ name: 'auth_token', value: backendData.authToken, domain: 'localhost', path: '/' });
    }
    if (backendData.csrfToken) {
      cookies.push({ name: 'csrf_token', value: backendData.csrfToken, domain: 'localhost', path: '/' });
    }
  }

  await page.context().addCookies(cookies);
}

export async function loginAs(
  ctx: ReturnType<typeof playwrightRequest.newContext> extends Promise<infer T> ? T : never,
  email: string,
  password: string,
): Promise<{ authToken: string; csrfToken: string }> {
  const res = await ctx.fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`);
  return res.json();
}

export async function adminLogin(request: any, retries = 3): Promise<{ authToken: string; csrfToken: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
      });
      if (!res.ok()) throw new Error(`Admin login failed: ${res.status()}`);
      return res.json();
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Admin login failed after retries');
}

export function authHeaders(token: string, csrf: string) {
  return {
    Authorization: `Bearer ${token}`,
    'X-CSRF-Token': csrf,
  };
}

export const CONTRACT_TEMPLATE = {
  fecha: '2026-06-24',
  domicilio: 'Test St',
  empresa: '',
  adulto: 'SI',
  telefono: '600111222',
  duracion: 'meses',
  modalidad: ['Presencial'],
  lugar: 'Madrid',
  firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  derechoDatos: true,
  derechoImagen: true,
  derechoConfidencialidad: true,
  horario: 'tardes',
};

export async function seedQuizCourse(request: any): Promise<{ courseId: string; lessonId: string }> {
  const { authToken: adminToken, csrfToken: adminCsrf } = await adminLogin(request);

  // 1. Create a unique published course
  const courseTitle = `Quiz E2E ${Date.now()}`;
  const courseRes = await request.fetch(`${BACKEND_URL}/api/courses`, {
    method: 'POST',
    headers: { ...authHeaders(adminToken, adminCsrf), 'Content-Type': 'application/json' },
    data: {
      title: courseTitle,
      description: 'Curso de prueba para quiz e2e',
      status: 'published',
      level: 'beginner',
      category: 'Formación',
    },
  });
  if (!courseRes.ok()) {
    const body = await courseRes.text();
    throw new Error(`Failed to create course: ${courseRes.status()} ${body}`);
  }

  // 2. Find the course ID by listing all courses
  const listRes = await request.fetch(`${BACKEND_URL}/api/courses?status=all`, {
    headers: authHeaders(adminToken, adminCsrf),
  });
  if (!listRes.ok()) {
    const body = await listRes.text();
    throw new Error(`Failed to list courses: ${listRes.status()} ${body}`);
  }
  const listJson = await listRes.json();
  const courses = Array.isArray(listJson) ? listJson : listJson.data || [];
  const course = courses.find((c: any) => c.title === courseTitle);
  expect(course, 'Seeded course not found').toBeTruthy();
  const courseId = course.id;

  // 3. Create module
  const moduleRes = await request.fetch(`${BACKEND_URL}/api/courses/${courseId}/modules`, {
    method: 'POST',
    headers: { ...authHeaders(adminToken, adminCsrf), 'Content-Type': 'application/json' },
    data: {
      title: 'Módulo Quiz',
      description: 'Módulo de prueba con quiz',
      order: 1,
    },
  });
  if (!moduleRes.ok()) {
    const body = await moduleRes.text();
    throw new Error(`Failed to create module: ${moduleRes.status()} ${body}`);
  }

  // 4. Get module ID from course detail
  const courseDetailRes = await request.fetch(`${BACKEND_URL}/api/courses/${courseId}`, {
    headers: authHeaders(adminToken, adminCsrf),
  });
  if (!courseDetailRes.ok()) {
    const body = await courseDetailRes.text();
    throw new Error(`Failed to get course detail: ${courseDetailRes.status()} ${body}`);
  }
  const courseDetail = await courseDetailRes.json();
  const module = (courseDetail.modules || []).find((m: any) => m.title === 'Módulo Quiz');
  expect(module, 'Seeded module not found').toBeTruthy();
  const moduleId = module.id;

  // 5. Create quiz lesson
  const lessonRes = await request.fetch(`${BACKEND_URL}/api/courses/${courseId}/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { ...authHeaders(adminToken, adminCsrf), 'Content-Type': 'application/json' },
    data: {
      title: 'Lección Quiz',
      content_type: 'quiz',
      content: JSON.stringify({
        question: '¿Cuál es la capital de España?',
        options: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'],
        correct: 0,
      }),
      order: 1,
    },
  });
  if (!lessonRes.ok()) {
    const body = await lessonRes.text();
    throw new Error(`Failed to create lesson: ${lessonRes.status()} ${body}`);
  }

  // 6. Get lesson ID
  const refreshedRes = await request.fetch(`${BACKEND_URL}/api/courses/${courseId}`, {
    headers: authHeaders(adminToken, adminCsrf),
  });
  if (!refreshedRes.ok()) {
    const body = await refreshedRes.text();
    throw new Error(`Failed to refresh course: ${refreshedRes.status()} ${body}`);
  }
  const refreshed = await refreshedRes.json();
  const refreshedModule = (refreshed.modules || []).find((m: any) => m.title === 'Módulo Quiz');
  const lesson = (refreshedModule?.lessons || []).find((l: any) => l.title === 'Lección Quiz');
  expect(lesson, 'Seeded lesson not found').toBeTruthy();
  const lessonId = lesson.id;

  // 7. Login as volunteer to enroll them
  const volunteerRes = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    data: { email: 'general@fundacionaltius.org', password: 'general123' },
  });
  if (!volunteerRes.ok()) {
    const body = await volunteerRes.text();
    throw new Error(`Failed to login as volunteer: ${volunteerRes.status()} ${body}`);
  }
  const volunteerData = await volunteerRes.json();
  const volunteerToken = volunteerData.authToken;
  const volunteerCsrf = volunteerData.csrfToken || '';

  // 8. Enroll volunteer in the course
  const enrollRes = await request.fetch(`${BACKEND_URL}/api/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: { ...authHeaders(volunteerToken, volunteerCsrf), 'Content-Type': 'application/json' },
  });
  if (!enrollRes.ok() && enrollRes.status() !== 400) {
    const body = await enrollRes.text();
    throw new Error(`Failed to enroll volunteer: ${enrollRes.status()} ${body}`);
  }

  return { courseId, lessonId };
}
