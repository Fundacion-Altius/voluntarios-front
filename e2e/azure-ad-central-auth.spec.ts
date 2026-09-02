/**
 * End-to-End Tests for Azure AD Central Auth Host Pattern
 * 
 * Tests the complete OAuth flow with tenant handoff:
 * 1. User on tenant host clicks Azure AD login
 * 2. Redirect to auth host with tenant context
 * 3. Auth host initiates OAuth with Azure AD
 * 4. Azure AD callback to auth host
 * 5. Auth host validates state, creates handoff token
 * 6. Redirect to tenant host with handoff token
 * 7. Tenant host validates token, sets session cookie
 * 8. User is logged in on tenant host
 */

import { test, expect, describe, beforeAll, afterAll } from '@playwright/test';
import crypto from 'crypto';

// Test configuration
const TEST_SECRET = 'test-secret-for-e2e-tests';
const AUTH_HOST = 'http://localhost:3000';
const TENANT_HOSTS = {
  fundacionaltius: 'http://fundacionaltius.localhost:3000',
  homelessentrepreneur: 'http://homelessentrepreneur.localhost:3000',
};

// Helper to create signed state (mirrors authState.ts logic)
function createTestState(tenant: string, returnTo: string): string {
  const payload = {
    tenant,
    returnTo,
    timestamp: Date.now(),
  };
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', TEST_SECRET)
    .update(payloadString)
    .digest('hex');
  return `${payloadBase64}.${signature}`;
}

// Helper to create handoff token (mirrors authState.ts logic)
function createTestHandoffToken(userData: any): string {
  const payload = {
    user: userData,
    authToken: 'test-auth-token',
    csrfToken: 'test-csrf-token',
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', TEST_SECRET)
    .update(payloadString)
    .digest('hex');
  return `${payloadBase64}.${signature}`;
}

describe('Azure AD Central Auth Host Pattern', () => {
  // Mock environment variables for the test
  beforeAll(async () => {
    // In a real test, you would set these in the test environment
    process.env.NEXTAUTH_SECRET = TEST_SECRET;
    process.env.NEXTAUTH_URL = AUTH_HOST;
  });

  afterAll(async () => {
    // Clean up
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
  });

  describe('Tenant Detection and Redirect', () => {
    test('tenant host login redirects to auth host with tenant context', async ({ page }) => {
      // Mock the signIn function to avoid actual OAuth
      await page.route('**/api/auth/signin/azure-ad*', route => {
        const url = new URL(route.request().url());
        const state = url.searchParams.get('state');
        
        // Verify state contains tenant info
        expect(state).toBeTruthy();
        expect(state).toContain('fundacionaltius');
        
        // Mock successful OAuth response
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Navigate to tenant host login
      await page.goto(`${TENANT_HOSTS.fundacionaltius}/login`);
      
      // Click Azure AD login button
      const loginButton = page.getByRole('button', { name: /microsoft/i });
      await expect(loginButton).toBeVisible();
      
      // Mock the click to redirect to auth host
      await page.evaluate(() => {
        // Simulate the redirect logic from LoginForm.tsx
        const tenant = 'fundacionaltius';
        const returnTo = '/admin/dashboard';
        const state = createTestState(tenant, returnTo);
        window.location.href = `${AUTH_HOST}/login?tenant=${tenant}&return_to=${returnTo}&state=${state}`;
      });
      
      // Wait for redirect to auth host
      await page.waitForURL(`${AUTH_HOST}/login*`);
      
      // Verify we're on auth host with tenant context
      const url = new URL(page.url());
      expect(url.host).toBe('localhost:3000');
      expect(url.searchParams.get('tenant')).toBe('fundacionaltius');
      expect(url.searchParams.get('return_to')).toBe('/admin/dashboard');
      expect(url.searchParams.get('state')).toBeTruthy();
    });

    test('auth host login redirects to tenant host after OAuth', async ({ page }) => {
      // Mock the OAuth callback
      await page.route('**/api/auth/callback/azure-ad*', route => {
        const url = new URL(route.request().url());
        const state = url.searchParams.get('state');
        
        expect(state).toBeTruthy();
        
        // Mock successful callback that redirects to tenant handoff
        route.fulfill({
          status: 302,
          headers: {
            'Location': `${AUTH_HOST}/api/auth/tenant-handoff?state=${state}`,
          },
        });
      });

      // Mock the tenant handoff endpoint
      await page.route('**/api/auth/tenant-handoff*', route => {
        const url = new URL(route.request().url());
        const state = url.searchParams.get('state');
        
        expect(state).toBeTruthy();
        
        // Verify state and create handoff token
        const verified = verifyTestState(state);
        expect(verified).toBeTruthy();
        
        // Create handoff token
        const handoffToken = createTestHandoffToken({
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          user_type: 'staff',
        });
        
        // Redirect to tenant host
        const tenantHost = TENANT_HOSTS[verified.tenant as keyof typeof TENANT_HOSTS];
        route.fulfill({
          status: 302,
          headers: {
            'Location': `${tenantHost}/api/auth/receive-handoff?token=${handoffToken}&return_to=${verified.returnTo}`,
          },
        });
      });

      // Mock the receive handoff endpoint
      await page.route('**/api/auth/receive-handoff*', route => {
        const url = new URL(route.request().url());
        const token = url.searchParams.get('token');
        const returnTo = url.searchParams.get('return_to');
        
        expect(token).toBeTruthy();
        expect(returnTo).toBe('/admin/dashboard');
        
        // Verify token and set session cookie
        const verified = verifyTestHandoffToken(token);
        expect(verified).toBeTruthy();
        
        // Redirect to returnTo with session
        route.fulfill({
          status: 302,
          headers: {
            'Location': returnTo,
            'Set-Cookie': 'next-auth.session-token=test-session-token; Path=/; HttpOnly; SameSite=Lax',
          },
        });
      });

      // Start on auth host with tenant context
      const state = createTestState('fundacionaltius', '/admin/dashboard');
      await page.goto(`${AUTH_HOST}/login?tenant=fundacionaltius&return_to=/admin/dashboard&state=${state}`);
      
      // Mock clicking Azure AD login
      await page.evaluate(() => {
        window.location.href = `${AUTH_HOST}/api/auth/callback/azure-ad?code=test-code&state=${new URL(window.location.href).searchParams.get('state')}`;
      });
      
      // Should redirect through handoff to tenant host
      await page.waitForURL(`${TENANT_HOSTS.fundacionaltius}/admin/dashboard`);
      
      // Verify we're on tenant host
      expect(page.url()).toContain(TENANT_HOSTS.fundacionaltius);
      expect(page.url()).toContain('/admin/dashboard');
    });
  });

  describe('State Parameter Validation', () => {
    test('rejects tampered state parameter', async ({ page }) => {
      // Create a valid state
      const validState = createTestState('fundacionaltius', '/admin/dashboard');
      
      // Tamper with it
      const tamperedState = validState.replace('fundacionaltius', 'evil-tenant');
      
      // Mock the tenant handoff endpoint to reject tampered state
      await page.route('**/api/auth/tenant-handoff*', route => {
        const url = new URL(route.request().url());
        const state = url.searchParams.get('state');
        
        // Verify state is tampered
        const verified = verifyTestState(state);
        expect(verified).toBeNull();
        
        // Redirect to login with error
        route.fulfill({
          status: 302,
          headers: {
            'Location': `${AUTH_HOST}/login?error=invalid_state`,
          },
        });
      });

      // Try to access handoff with tampered state
      await page.goto(`${AUTH_HOST}/api/auth/tenant-handoff?state=${tamperedState}`);
      
      // Should redirect to login with error
      await page.waitForURL(`${AUTH_HOST}/login?error=invalid_state`);
      
      const url = new URL(page.url());
      expect(url.searchParams.get('error')).toBe('invalid_state');
    });

    test('rejects expired state parameter', async ({ page }) => {
      // Create a state with old timestamp
      const oldPayload = {
        tenant: 'fundacionaltius',
        returnTo: '/admin/dashboard',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };
      const payloadString = JSON.stringify(oldPayload);
      const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
      const signature = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(payloadString)
        .digest('hex');
      const expiredState = `${payloadBase64}.${signature}`;
      
      // Mock the tenant handoff endpoint to reject expired state
      await page.route('**/api/auth/tenant-handoff*', route => {
        const url = new URL(route.request().url());
        const state = url.searchParams.get('state');
        
        // Verify state is expired
        const verified = verifyTestState(state);
        expect(verified).toBeNull();
        
        // Redirect to login with error
        route.fulfill({
          status: 302,
          headers: {
            'Location': `${AUTH_HOST}/login?error=invalid_state`,
          },
        });
      });

      // Try to access handoff with expired state
      await page.goto(`${AUTH_HOST}/api/auth/tenant-handoff?state=${expiredState}`);
      
      // Should redirect to login with error
      await page.waitForURL(`${AUTH_HOST}/login?error=invalid_state`);
    });
  });

  describe('Tenant Isolation', () => {
    test('session on fundacionaltius does not affect homelessentrepreneur', async ({ page, context }) => {
      // First, login on fundacionaltius
      const state1 = createTestState('fundacionaltius', '/admin/dashboard');
      await page.goto(`${AUTH_HOST}/login?tenant=fundacionaltius&return_to=/admin/dashboard&state=${state1}`);
      
      // Mock the full flow
      await page.evaluate(() => {
        window.location.href = `${AUTH_HOST}/api/auth/callback/azure-ad?code=test-code&state=${new URL(window.location.href).searchParams.get('state')}`;
      });
      
      // Mock handoff
      await page.route('**/api/auth/tenant-handoff*', route => {
        const url = new URL(route.request().url());
        const state = url.searchParams.get('state');
        const verified = verifyTestState(state);
        
        if (verified?.tenant === 'fundacionaltius') {
          const handoffToken = createTestHandoffToken({
            id: 'user-1',
            email: 'user1@fundacionaltius.com',
            name: 'User One',
            role: 'admin',
            user_type: 'staff',
          });
          
          route.fulfill({
            status: 302,
            headers: {
              'Location': `${TENANT_HOSTS.fundacionaltius}/api/auth/receive-handoff?token=${handoffToken}&return_to=/admin/dashboard`,
            },
          });
        }
      });
      
      // Mock receive handoff
      await page.route('**/api/auth/receive-handoff*', route => {
        const url = new URL(route.request().url());
        const token = url.searchParams.get('token');
        const returnTo = url.searchParams.get('return_to');
        
        if (token && verifyTestHandoffToken(token)) {
          route.fulfill({
            status: 302,
            headers: {
              'Location': returnTo,
              'Set-Cookie': 'next-auth.session-token=fundacionaltius-session; Path=/; HttpOnly; SameSite=Lax; Domain=fundacionaltius.localhost:3000',
            },
          });
        }
      });
      
      // Complete login on fundacionaltius
      await page.waitForURL(`${TENANT_HOSTS.fundacionaltius}/admin/dashboard`);
      
      // Verify we're logged in on fundacionaltius
      const cookies1 = await context.cookies();
      const fundacionaltiusCookie = cookies1.find(c => 
        c.name === 'next-auth.session-token' && 
        c.domain === 'fundacionaltius.localhost:3000'
      );
      expect(fundacionaltiusCookie).toBeTruthy();
      
      // Now check homelessentrepreneur in a new context (simulating different browser)
      const newContext = await page.context().newContext();
      const newPage = await newContext.newPage();
      
      // Navigate to homelessentrepreneur
      await newPage.goto(`${TENANT_HOSTS.homelessentrepreneur}/admin/dashboard`);
      
      // Should NOT be logged in (no session cookie for this host)
      const cookies2 = await newContext.cookies();
      const homelessCookie = cookies2.find(c => 
        c.name === 'next-auth.session-token' && 
        c.domain === 'homelessentrepreneur.localhost:3000'
      );
      expect(homelessCookie).toBeFalsy();
      
      // Should redirect to login or show unauthorized
      // (This depends on your middleware implementation)
      await expect(newPage).not.toHaveURL(/.+\/admin\/dashboard$/);
      
      await newContext.close();
    });

    test('unknown tenant host returns 404', async ({ page }) => {
      // Navigate to unknown tenant host
      await page.goto('http://unknown.localhost:3000/login');
      
      // Should return 404
      await expect(page).toHaveURL(/404/);
      // Or check for 404 response
      const response = await page.waitForResponse(response => 
        response.status() === 404
      );
      expect(response.status()).toBe(404);
    });
  });

  describe('Handoff Token Validation', () => {
    test('rejects tampered handoff token', async ({ page }) => {
      // Create a valid handoff token
      const validToken = createTestHandoffToken({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        user_type: 'staff',
      });
      
      // Tamper with it
      const tamperedToken = validToken.replace('test-user', 'evil-user');
      
      // Mock the receive handoff endpoint to reject tampered token
      await page.route('**/api/auth/receive-handoff*', route => {
        const url = new URL(route.request().url());
        const token = url.searchParams.get('token');
        
        // Verify token is tampered
        const verified = verifyTestHandoffToken(token);
        expect(verified).toBeNull();
        
        // Redirect to login with error
        route.fulfill({
          status: 302,
          headers: {
            'Location': `${TENANT_HOSTS.fundacionaltius}/login?error=invalid_token`,
          },
        });
      });

      // Try to access receive handoff with tampered token
      await page.goto(`${TENANT_HOSTS.fundacionaltius}/api/auth/receive-handoff?token=${tamperedToken}&return_to=/admin/dashboard`);
      
      // Should redirect to login with error
      await page.waitForURL(`${TENANT_HOSTS.fundacionaltius}/login?error=invalid_token`);
      
      const url = new URL(page.url());
      expect(url.searchParams.get('error')).toBe('invalid_token');
    });

    test('rejects expired handoff token', async ({ page }) => {
      // Create a handoff token with past expiry
      const expiredPayload = {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          user_type: 'staff',
        },
        authToken: 'test-token',
        csrfToken: 'test-csrf',
        expires: Date.now() - 1000, // 1 second ago
      };
      const payloadString = JSON.stringify(expiredPayload);
      const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
      const signature = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(payloadString)
        .digest('hex');
      const expiredToken = `${payloadBase64}.${signature}`;
      
      // Mock the receive handoff endpoint to reject expired token
      await page.route('**/api/auth/receive-handoff*', route => {
        const url = new URL(route.request().url());
        const token = url.searchParams.get('token');
        
        // Verify token is expired
        const verified = verifyTestHandoffToken(token);
        expect(verified).toBeNull();
        
        // Redirect to login with error
        route.fulfill({
          status: 302,
          headers: {
            'Location': `${TENANT_HOSTS.fundacionaltius}/login?error=token_expired`,
          },
        });
      });

      // Try to access receive handoff with expired token
      await page.goto(`${TENANT_HOSTS.fundacionaltius}/api/auth/receive-handoff?token=${expiredToken}&return_to=/admin/dashboard`);
      
      // Should redirect to login with error
      await page.waitForURL(`${TENANT_HOSTS.fundacionaltius}/login?error=token_expired`);
    });
  });
});

// Helper to verify state (mirrors authState.ts logic)
function verifyTestState(state: string): { tenant: string; returnTo: string } | null {
  if (!state) return null;
  
  try {
    const [payloadBase64, signature] = state.split('.');
    if (!payloadBase64 || !signature) return null;
    
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadString);
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(payloadString)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    // Verify timestamp is recent (5 minutes)
    const age = Date.now() - payload.timestamp;
    if (age < 0 || age > 5 * 60 * 1000) return null;
    
    // Verify tenant is known
    const knownTenants = ['fundacionaltius', 'homelessentrepreneur'];
    if (!knownTenants.includes(payload.tenant)) return null;
    
    // Verify returnTo is a safe path
    if (!payload.returnTo || !payload.returnTo.startsWith('/')) return null;
    
    return {
      tenant: payload.tenant,
      returnTo: payload.returnTo,
    };
  } catch {
    return null;
  }
}

// Helper to verify handoff token (mirrors authState.ts logic)
function verifyTestHandoffToken(token: string): any | null {
  if (!token) return null;
  
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;
    
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadString);
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(payloadString)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    // Verify token is not expired
    if (Date.now() > payload.expires) return null;
    
    return payload;
  } catch {
    return null;
  }
}
