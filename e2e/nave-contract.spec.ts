import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = 'http://localhost:3001';
const PUBLIC_DIR = path.resolve('/home/student/Documentos/dev/voluntarios/voluntarios-back/public');

test('create a contract with Nave area and generate PDF', async ({ request }) => {
  // Clear any existing PDFs for a clean check
  const beforeFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('contrato-') && f.endsWith('.pdf'));
  for (const f of beforeFiles) {
    fs.unlinkSync(path.join(PUBLIC_DIR, f));
  }

  // Create contract via API with "Nave" area
  const createResponse = await request.post(`${BACKEND_URL}/api/contracts`, {
    data: {
      nombre: 'Playwright Nave Test',
      id: 'Z1234567R',
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
  const pdfResponse = await request.get(`${BACKEND_URL}/api/generate-pdf?id=Z1234567R`);
  expect(pdfResponse.ok()).toBeTruthy();

  // Verify a new PDF file was created in the backend public directory
  const afterFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('contrato-') && f.endsWith('.pdf'));
  expect(afterFiles.length).toBeGreaterThan(0);

  // Log the generated PDF filename
  const newPdf = afterFiles[0];
  const pdfPath = path.join(PUBLIC_DIR, newPdf);
  const pdfStats = fs.statSync(pdfPath);
  expect(pdfStats.size).toBeGreaterThan(0);

  console.log(`\n✓ PDF generated: ${pdfPath}`);
  console.log(`  File size: ${pdfStats.size} bytes`);
  console.log(`  Area: Nave`);
  console.log(`  Contract ID: Z1234567R`);
});
