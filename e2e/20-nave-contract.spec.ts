import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const PUBLIC_DIR = path.resolve('/home/student/Documentos/dev/voluntarios/voluntarios-back/public');

test('contract form renders styled shadcn elements', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

  const nombre = page.locator('input[id="nombre"]');
  await expect(nombre).toBeVisible();
  await expect(nombre).toHaveAttribute('type', 'text');

  const dni = page.locator('input[id="id"]');
  await expect(dni).toBeVisible();

  const domicilio = page.locator('input[id="domicilio"]');
  await expect(domicilio).toBeVisible();

  const telefono = page.locator('input[id="telefono"]');
  await expect(telefono).toBeVisible();

  const email = page.locator('input[id="email"]');
  await expect(email).toBeVisible();

  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toContainText('Siguiente');

  expect(errors.length).toBe(0);
});

test('create a contract with Nave area and generate PDF', async ({ request }) => {
  const uid = Date.now();
  const contractId = `NAVE-PDF-${uid}`;

  // ───── Login as admin ─────
  const loginRes = await request.fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    data: { email: 'admin@fundacionaltius.org', password: 'admin123' },
  });
  expect(loginRes.ok()).toBeTruthy();
  const { authToken, csrfToken } = await loginRes.json();

  const authHeaders = {
    Authorization: `Bearer ${authToken}`,
    'X-CSRF-Token': csrfToken,
  };

  // Clear any existing PDFs for a clean check
  const beforeFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('contrato-') && f.endsWith('.pdf'));
  for (const f of beforeFiles) {
    fs.unlinkSync(path.join(PUBLIC_DIR, f));
  }

  // Create contract via API with "Nave" area
  const createResponse = await request.fetch(`${BACKEND_URL}/api/contracts`, {
    method: 'POST',
    headers: authHeaders,
    data: {
      nombre: 'Playwright Nave Test',
      id: contractId,
      fecha: '2026-06-23',
      domicilio: 'Calle Playwright 42',
      empresa: '',
      adulto: 'SI',
      telefono: '600111222',
      areas: ['Nave'],
      duracion: 'años',
      modalidad: ['Presencial'],
      lugar: 'Madrid',
      firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      derechoDatos: true,
      derechoImagen: true,
      derechoConfidencialidad: true,
      horario: 'días laborables mañana',
      email: 'playwright-nave@example.com',
    },
  });

  expect(createResponse.ok()).toBeTruthy();
  const contract = await createResponse.json();
  expect(contract.contract.areas).toContain('Nave');

  // Generate PDF via API
  const pdfResponse = await request.fetch(`${BACKEND_URL}/api/generate-pdf?id=${contractId}`, {
    method: 'GET',
  });
  expect(pdfResponse.ok()).toBeTruthy();

  // Verify a new PDF file was created in the backend public directory
  const afterFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('contrato-') && f.endsWith('.pdf'));
  expect(afterFiles.length).toBeGreaterThan(0);

  const newPdf = afterFiles[0];
  const pdfPath = path.join(PUBLIC_DIR, newPdf);
  const pdfStats = fs.statSync(pdfPath);
  expect(pdfStats.size).toBeGreaterThan(0);
});
