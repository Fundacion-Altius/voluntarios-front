import dns from 'node:dns';
import { defineConfig } from '@playwright/test';

// Tenant hosts (fundacionaltius.localhost, …) resolve ::1 first on this machine,
// but Next.js listens on IPv4 only → ECONNREFUSED ::1:3000 without ipv4first.
dns.setDefaultResultOrder('ipv4first');

const TENANT_HOST_RESOLVER =
  'MAP fundacionaltius.localhost 127.0.0.1,MAP homelessentrepreneur.localhost 127.0.0.1';

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
    command: 'pnpm dev',
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
      testIgnore: ['**/02-login-diagnostic.spec.ts', '**/08-real-flow.spec.ts', '**/26-video-*.spec.ts'],
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
  ],
});
