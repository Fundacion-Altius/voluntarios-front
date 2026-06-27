import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3001';

test.describe('Admin Role User - Contract Visibility', () => {
  const uid = Date.now();
  const naveContractId = `ADM-NAVE-${uid}`;
  const genContractId = `ADM-GEN-${uid}`;

  test('admin user sees all contracts regardless of area', async ({ request }) => {
    // ───── Login as admin ─────
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

    // ───── Create a contract WITH Nave area ─────
    const naveRes = await request.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      data: {
        id: naveContractId,
        nombre: 'Admin Test Nave',
        fecha: '2026-06-24',
        domicilio: 'Nave St',
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
        horario: 'mañana',
        email: 'admin-nave@example.com',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(naveRes.ok()).toBeTruthy();

    // ───── Create a contract WITHOUT Nave area ─────
    const genRes = await request.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      data: {
        id: genContractId,
        nombre: 'Admin Test General',
        fecha: '2026-06-24',
        domicilio: 'General St',
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
        email: 'admin-gen@example.com',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(genRes.ok()).toBeTruthy();

    // ───── Fetch contracts as admin (same session) ─────
    const contractsRes = await request.fetch(`${BACKEND_URL}/api/contracts?pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(contractsRes.ok()).toBeTruthy();
    const { data: contracts } = await contractsRes.json() as any;

    // ───── Assert: Nave contract IS visible ─────
    const foundNave = contracts.find((c: any) => c.id === naveContractId);
    expect(foundNave).toBeDefined();

    // ───── Assert: non-Nave contract IS visible ─────
    const foundGen = contracts.find((c: any) => c.id === genContractId);
    expect(foundGen).toBeDefined();

    // ───── Assert: both are present regardless of area ─────
    const bothPresent = contracts.some((c: any) => c.id === naveContractId)
      && contracts.some((c: any) => c.id === genContractId);
    expect(bothPresent).toBe(true);

    // ───── Cleanup ─────
    const cleanupLogin = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
      headers: { 'X-CSRF-Token': adminCsrf },
    });
    const cleanupBody = await cleanupLogin.json();
    const cleanupToken: string = cleanupBody.authToken;
    const cleanupCsrf: string = cleanupBody.csrfToken;

    await request.fetch(`${BACKEND_URL}/api/contracts/${naveContractId}`, {
      method: 'DELETE',
      headers: authHeaders(cleanupToken, cleanupCsrf),
    });
    await request.fetch(`${BACKEND_URL}/api/contracts/${genContractId}`, {
      method: 'DELETE',
      headers: authHeaders(cleanupToken, cleanupCsrf),
    });
  });
});
