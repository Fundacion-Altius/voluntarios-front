import dns from 'node:dns';
import { defineConfig } from '@playwright/test';

// Tenant hosts (fundacionaltius.localhost, …) resolve ::1 first on this machine,
// but Next.js listens on IPv4 only → ECONNREFUSED ::1:3000 without ipv4first.
dns.setDefaultResultOrder('ipv4first');

const TENANT_HOST_RESOLVER =
  'MAP fundacionaltius.localhost 127.0.0.1,MAP homelessentrepreneur.localhost 127.0.0.1';

/** forms-review uses a production Next server (no cold compile). */
const formsProd = process.env.PLAYWRIGHT_FORMS_PROD === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    locale: 'es-ES',
    extraHTTPHeaders: {
      'Accept-Language': 'es-ES,es;q=0.9',
    },
    trace: 'on-first-retry',
  },
  webServer: {
    // Default suite keeps `pnpm dev`. forms-review scripts set PLAYWRIGHT_FORMS_PROD=1
    // after `pnpm build` so pages are already compiled (`next start`).
    command: formsProd ? 'pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [`--host-resolver-rules=${TENANT_HOST_RESOLVER}`],
        },
      },
      testIgnore: [
        '**/02-login-diagnostic.spec.ts',
        '**/08-real-flow.spec.ts',
        '**/26-video-*.spec.ts',
        '**/*.setup.ts',
        // Owned by project `forms-review` (run with --workers=1)
        '**/40-forms-*.spec.ts',
        '**/41-forms-*.spec.ts',
        '**/42-forms-*.spec.ts',
        '**/43-forms-*.spec.ts',
        '**/44-forms-*.spec.ts',
      ],
    },
    {
      name: 'real-api',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [`--host-resolver-rules=${TENANT_HOST_RESOLVER}`],
        },
      },
      testMatch: '**/08-real-flow.spec.ts',
      retries: 1,
    },
    {
      name: 'video',
      use: {
        browserName: 'chromium',
        video: 'on',
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            `--host-resolver-rules=${TENANT_HOST_RESOLVER}`,
          ],
        },
      },
      testMatch: '**/26-video-*.spec.ts',
      retries: 1,
    },
    {
      // One-shot admin login for forms-review (storageState).
      name: 'forms-setup',
      testMatch: '**/forms-auth.setup.ts',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [`--host-resolver-rules=${TENANT_HOST_RESOLVER}`],
        },
      },
    },
    {
      // Primary-course recordings for stakeholder review (Carlos).
      // Run: pnpm test:e2e:forms-review   or   pnpm test:e2e:forms-review:ui
      name: 'forms-review',
      dependencies: ['forms-setup'],
      fullyParallel: false,
      use: {
        browserName: 'chromium',
        storageState: 'e2e/.auth/forms-admin.json',
        video: 'retain-on-failure',
        actionTimeout: 15000,
        navigationTimeout: 60000,
        launchOptions: {
          args: [`--host-resolver-rules=${TENANT_HOST_RESOLVER}`],
        },
      },
      testMatch: [
        '**/40-forms-admin.spec.ts',
        '**/41-forms-public.spec.ts',
        '**/42-forms-conditional.spec.ts',
        '**/43-forms-estrellas.spec.ts',
        '**/44-forms-d48.spec.ts',
        '**/45-forms-all-types.spec.ts',
      ],
    },
  ],
});
