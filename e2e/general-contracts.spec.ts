import { test, expect, request as playwrightRequest } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3001';

test.describe('General Role User - Contract Filtering', () => {
  const uid = Date.now();
  const generalEmail = `general.test.${uid}@fundacionaltius.org`;
  const naveContractId = `TEST-NAVE-${uid}`;
  const genContractId = `TEST-GEN-${uid}`;

  test('general user sees only non-Nave contracts', async ({ request }) => {
    // ───── 1. Login as admin ─────
    const adminLogin = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const adminBody = await adminLogin.json();
    const adminToken: string = adminBody.authToken;
    const adminCsrf: string = adminBody.csrfToken;

    const authHeaders = (token: string, csrf: string) => ({
      Authorization: `Bearer ${token}`,
      'X-CSRF-Token': csrf,
    });

    // ───── 2. Create a general user with password ─────
    const createUserRes = await request.fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      data: {
        name: 'General Test User',
        email: generalEmail,
        role: 'general',
        password: 'generalTest123',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(createUserRes.ok()).toBeTruthy();
    const userData = await createUserRes.json();
    const generalUserId: string = userData.user_id;
    expect(userData.role).toBe('general');

    // ───── 3. Create a contract WITH Nave (should be hidden from general) ─────
    const naveRes = await request.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      data: {
        id: naveContractId,
        nombre: 'Test Nave Contract',
        fecha: '2026-06-24',
        domicilio: 'Calle Test 1',
        empresa: '',
        adulto: 'SI',
        telefono: '600111222',
        areas: ['Nave'],
        duracion: 'meses',
        modalidad: ['Presencial'],
        lugar: 'Madrid',
        firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        derechoDatos: true,
        derechoImagen: true,
        derechoConfidencialidad: true,
        horario: 'días laborables mañana',
        email: 'test-nave@example.com',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(naveRes.ok()).toBeTruthy();

    // ───── 4. Create a contract WITHOUT Nave (should be visible) ─────
    const genRes = await request.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      data: {
        id: genContractId,
        nombre: 'Test General Contract',
        fecha: '2026-06-24',
        domicilio: 'Calle Test 2',
        empresa: '',
        adulto: 'SI',
        telefono: '600111333',
        areas: ['Reparto de Alimentos'],
        duracion: 'meses',
        modalidad: ['Presencial'],
        lugar: 'Valencia',
        firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        derechoDatos: true,
        derechoImagen: true,
        derechoConfidencialidad: true,
        horario: 'tardes',
        email: 'test-general@example.com',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(genRes.ok()).toBeTruthy();

    // ───── 5. Login as the general user (fresh context to avoid CSRF cookie interference) ─────
    const generalCtx = await playwrightRequest.newContext();
    const generalLogin = await generalCtx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: generalEmail, password: 'generalTest123' },
    });
    expect(generalLogin.ok()).toBeTruthy();
    const generalBody = await generalLogin.json();
    const generalToken: string = generalBody.authToken;
    const generalCsrf: string = generalBody.csrfToken;

    // ───── 6. Fetch contracts as general user ─────
    const contractsRes = await request.fetch(`${BACKEND_URL}/api/contracts?pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${generalToken}` },
    });
    expect(contractsRes.ok()).toBeTruthy();
    const { data: contracts } = await contractsRes.json() as any;

    // ───── 7. Assert: Nave contract is NOT visible ─────
    const foundNave = contracts.find((c: any) => c.id === naveContractId);
    expect(foundNave).toBeUndefined();

    // ───── 8. Assert: non-Nave contract IS visible ─────
    const foundGen = contracts.find((c: any) => c.id === genContractId);
    expect(foundGen).toBeDefined();
    expect(foundGen.areas).not.toContain('Nave');

    // ───── 9. Verify no contract in the result has Nave area ─────
    const anyWithNave = contracts.some((c: any) => c.areas && c.areas.includes('Nave'));
    expect(anyWithNave).toBe(false);

    // ───── 10. Cleanup: login as admin (fresh context to avoid stale CSRF cookie) ─────
    const adminCtx = await playwrightRequest.newContext();
    const adminRelogin = await adminCtx.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
    });
    expect(adminRelogin.ok()).toBeTruthy();
    const adminReloginBody = await adminRelogin.json();
    const adminReloginToken: string = adminReloginBody.authToken;
    const adminReloginCsrf: string = adminReloginBody.csrfToken;

    await adminCtx.fetch(`${BACKEND_URL}/api/contracts/${naveContractId}`, {
      method: 'DELETE',
      headers: authHeaders(adminReloginToken, adminReloginCsrf),
    });
    await adminCtx.fetch(`${BACKEND_URL}/api/contracts/${genContractId}`, {
      method: 'DELETE',
      headers: authHeaders(adminReloginToken, adminReloginCsrf),
    });
    await adminCtx.fetch(`${BACKEND_URL}/api/users/${generalUserId}`, {
      method: 'DELETE',
      headers: authHeaders(adminReloginToken, adminReloginCsrf),
    });

    await generalCtx.dispose();
    await adminCtx.dispose();
  });
});
