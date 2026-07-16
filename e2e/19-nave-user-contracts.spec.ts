import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:3001';

test.describe('Nave Role User - Contract Filtering', () => {
  const uid = Date.now();
  const naveContractId = `TNAVE-${uid}`;
  const genContractId = `TGEN-${uid}`;

  test('nave user sees only Nave-area contracts', async ({ request }) => {
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
        nombre: 'Nave Area Contract',
        fecha: '2026-06-24',
        domicilio: 'Nave Street 1',
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
        email: 'nave-contract@example.com',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(naveRes.ok()).toBeTruthy();

    // ───── Create a contract WITHOUT Nave area ─────
    const genRes = await request.fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      data: {
        id: genContractId,
        nombre: 'General Area Contract',
        fecha: '2026-06-24',
        domicilio: 'General Street 2',
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
        email: 'general-contract@example.com',
      },
      headers: authHeaders(adminToken, adminCsrf),
    });
    expect(genRes.ok()).toBeTruthy();

    // ───── Login as the nave user ─────
    const naveLogin = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'nave@fundacionaltius.org', password: 'nave123' },
      headers: { 'X-CSRF-Token': adminCsrf },
    });
    expect(naveLogin.ok()).toBeTruthy();
    const naveBody = await naveLogin.json();
    const naveToken: string = naveBody.authToken;

    // ───── Fetch contracts as nave user ─────
    const contractsRes = await request.fetch(`${BACKEND_URL}/api/contracts?pageSize=100`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${naveToken}` },
    });
    expect(contractsRes.ok()).toBeTruthy();
    const { data: contracts } = await contractsRes.json() as any;

    // ───── Assert: Nave contract IS visible ─────
    const foundNave = contracts.find((c: any) => c.id === naveContractId);
    expect(foundNave).toBeDefined();
    expect(foundNave.areas).toContain('Nave');

    // ───── Assert: non-Nave contract is NOT visible ─────
    const foundGen = contracts.find((c: any) => c.id === genContractId);
    expect(foundGen).toBeUndefined();

    // ───── Assert: every visible contract has Nave area ─────
    const allHaveNave = contracts.every((c: any) => c.areas && c.areas.includes('Nave'));
    expect(allHaveNave).toBe(true);

    // ───── Cleanup: delete test data ─────
    const adminRelogin = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
      headers: { 'X-CSRF-Token': naveBody.csrfToken },
    });
    expect(adminRelogin.ok()).toBeTruthy();
    const adminReloginBody = await adminRelogin.json();
    const adminReloginToken: string = adminReloginBody.authToken;
    const adminReloginCsrf: string = adminReloginBody.csrfToken;

    await request.fetch(`${BACKEND_URL}/api/contracts/${naveContractId}`, {
      method: 'DELETE',
      headers: authHeaders(adminReloginToken, adminReloginCsrf),
    });
    await request.fetch(`${BACKEND_URL}/api/contracts/${genContractId}`, {
      method: 'DELETE',
      headers: authHeaders(adminReloginToken, adminReloginCsrf),
    });
  });
});
