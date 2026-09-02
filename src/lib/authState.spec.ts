/**
 * Unit tests for authState.ts
 * Tests state signing, verification, and token management
 */

import {
  createSignedState,
  verifySignedState,
  createHandoffToken,
  verifyHandoffToken,
  isAuthHost,
  getAuthHost,
  AuthStateConfig,
} from './authState';

// Test configuration with a known secret
const TEST_CONFIG: AuthStateConfig = {
  secret: 'test-secret-key-for-auth-state',
  stateExpiryMs: 5 * 60 * 1000, // 5 minutes
};

describe('authState', () => {
  describe('createSignedState', () => {
    it('should create a signed state with valid tenant and returnTo', () => {
      const state = createSignedState('fundacionaltius', '/admin/dashboard', TEST_CONFIG);
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state).toContain('.'); // Should have payload.signature format
    });

    it('should create different states for different inputs', () => {
      const state1 = createSignedState('fundacionaltius', '/admin/dashboard', TEST_CONFIG);
      const state2 = createSignedState('homelessentrepreneur', '/admin/dashboard', TEST_CONFIG);
      const state3 = createSignedState('fundacionaltius', '/portal', TEST_CONFIG);
      
      expect(state1).not.toBe(state2);
      expect(state1).not.toBe(state3);
      expect(state2).not.toBe(state3);
    });

    it('should throw error for unknown tenant', () => {
      expect(() => {
        createSignedState('unknown-tenant', '/admin/dashboard', TEST_CONFIG);
      }).toThrow('Unknown tenant: unknown-tenant');
    });

    it('should throw error for invalid returnTo (absolute URL)', () => {
      expect(() => {
        createSignedState('fundacionaltius', 'https://evil.com/steal', TEST_CONFIG);
      }).toThrow('returnTo must be a relative path starting with /');
    });

    it('should throw error for invalid returnTo (empty)', () => {
      expect(() => {
        createSignedState('fundacionaltius', '', TEST_CONFIG);
      }).toThrow('returnTo must be a relative path starting with /');
    });

    it('should throw error for invalid returnTo (no leading slash)', () => {
      expect(() => {
        createSignedState('fundacionaltius', 'admin/dashboard', TEST_CONFIG);
      }).toThrow('returnTo must be a relative path starting with /');
    });

    it('should throw error when secret is empty', () => {
      expect(() => {
        createSignedState('fundacionaltius', '/admin/dashboard', { secret: '', stateExpiryMs: 300000 });
      }).toThrow('NEXTAUTH_SECRET is required for state signing');
    });
  });

  describe('verifySignedState', () => {
    it('should verify a valid signed state', () => {
      const state = createSignedState('fundacionaltius', '/admin/dashboard', TEST_CONFIG);
      const verified = verifySignedState(state, TEST_CONFIG);
      
      expect(verified).not.toBeNull();
      expect(verified?.tenant).toBe('fundacionaltius');
      expect(verified?.returnTo).toBe('/admin/dashboard');
    });

    it('should return null for tampered state', () => {
      const state = createSignedState('fundacionaltius', '/admin/dashboard', TEST_CONFIG);
      const tamperedState = state.replace('fundacionaltius', 'homelessentrepreneur');
      const verified = verifySignedState(tamperedState, TEST_CONFIG);
      
      expect(verified).toBeNull();
    });

    it('should return null for invalid signature', () => {
      const state = 'eyJ0ZW5hbnQiOiAiZnVuZGFjaW9uYWx0aXVzIiwicmV0dXJuVG8iOiIvYWRtaW4vZGFzaGJvYXJkIiwidGltZXN0YW1wIjoxNjkzMjQ1NjAwMDAwfQ==.wrongsignature';
      const verified = verifySignedState(state, TEST_CONFIG);
      
      expect(verified).toBeNull();
    });

    it('should return null for expired state', () => {
      // Create a state with a very old timestamp
      const oldPayload = {
        tenant: 'fundacionaltius',
        returnTo: '/admin/dashboard',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };
      const payloadString = JSON.stringify(oldPayload);
      const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
      const signature = crypto.createHmac('sha256', TEST_CONFIG.secret)
        .update(payloadString)
        .digest('hex');
      const expiredState = `${payloadBase64}.${signature}`;
      
      const verified = verifySignedState(expiredState, TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should return null for future timestamp', () => {
      const futurePayload = {
        tenant: 'fundacionaltius',
        returnTo: '/admin/dashboard',
        timestamp: Date.now() + 10 * 60 * 1000, // 10 minutes in future
      };
      const payloadString = JSON.stringify(futurePayload);
      const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
      const signature = crypto.createHmac('sha256', TEST_CONFIG.secret)
        .update(payloadString)
        .digest('hex');
      const futureState = `${payloadBase64}.${signature}`;
      
      const verified = verifySignedState(futureState, TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should return null for unknown tenant in state', () => {
      const payload = {
        tenant: 'unknown-tenant',
        returnTo: '/admin/dashboard',
        timestamp: Date.now(),
      };
      const payloadString = JSON.stringify(payload);
      const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');
      const signature = crypto.createHmac('sha256', TEST_CONFIG.secret)
        .update(payloadString)
        .digest('hex');
      const state = `${payloadBase64}.${signature}`;
      
      const verified = verifySignedState(state, TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should return null for empty state', () => {
      const verified = verifySignedState('', TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should return null for state without separator', () => {
      const verified = verifySignedState('no-separator-here', TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should return null when secret is empty', () => {
      const state = createSignedState('fundacionaltius', '/admin/dashboard', TEST_CONFIG);
      const verified = verifySignedState(state, { secret: '', stateExpiryMs: 300000 });
      expect(verified).toBeNull();
    });
  });

  describe('createHandoffToken and verifyHandoffToken', () => {
    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      user_type: 'staff',
    };

    const testPayload = {
      user: testUser,
      authToken: 'test-auth-token',
      csrfToken: 'test-csrf-token',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    };

    it('should create and verify a valid handoff token', () => {
      const token = createHandoffToken(testPayload, TEST_CONFIG);
      const verified = verifyHandoffToken(token, TEST_CONFIG);
      
      expect(verified).not.toBeNull();
      expect(verified?.user.id).toBe('user-123');
      expect(verified?.user.email).toBe('test@example.com');
      expect(verified?.authToken).toBe('test-auth-token');
      expect(verified?.csrfToken).toBe('test-csrf-token');
    });

    it('should return null for tampered token', () => {
      const token = createHandoffToken(testPayload, TEST_CONFIG);
      const tamperedToken = token.replace('user-123', 'user-456');
      const verified = verifyHandoffToken(tamperedToken, TEST_CONFIG);
      
      expect(verified).toBeNull();
    });

    it('should return null for expired token', () => {
      const expiredPayload = {
        ...testPayload,
        expires: Date.now() - 1000, // 1 second ago
      };
      const token = createHandoffToken(expiredPayload, TEST_CONFIG);
      const verified = verifyHandoffToken(token, TEST_CONFIG);
      
      expect(verified).toBeNull();
    });

    it('should return null for empty token', () => {
      const verified = verifyHandoffToken('', TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should return null for token without separator', () => {
      const verified = verifyHandoffToken('no-separator', TEST_CONFIG);
      expect(verified).toBeNull();
    });

    it('should throw error when creating token with empty secret', () => {
      expect(() => {
        createHandoffToken(testPayload, { secret: '', stateExpiryMs: 300000 });
      }).toThrow('NEXTAUTH_SECRET is required for token signing');
    });
  });

  describe('isAuthHost', () => {
    it('should return true for localhost', () => {
      expect(isAuthHost('localhost')).toBe(true);
      expect(isAuthHost('localhost:3000')).toBe(true);
    });

    it('should return true for 127.0.0.1', () => {
      expect(isAuthHost('127.0.0.1')).toBe(true);
      expect(isAuthHost('127.0.0.1:3000')).toBe(true);
    });

    it('should return true for auth.klaruk.com', () => {
      expect(isAuthHost('auth.klaruk.com')).toBe(true);
      expect(isAuthHost('auth.klaruk.com:443')).toBe(true);
    });

    it('should return false for tenant hosts', () => {
      expect(isAuthHost('fundacionaltius.localhost:3000')).toBe(false);
      expect(isAuthHost('homelessentrepreneur.klaruk.com')).toBe(false);
    });

    it('should return false for empty or null host', () => {
      expect(isAuthHost('')).toBe(false);
      expect(isAuthHost(null)).toBe(false);
      expect(isAuthHost(undefined)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isAuthHost('LOCALHOST:3000')).toBe(true);
      expect(isAuthHost('Auth.Klaruk.Com')).toBe(true);
    });
  });

  describe('getAuthHost', () => {
    it('should return NEXTAUTH_URL if set', () => {
      process.env.NEXTAUTH_URL = 'https://auth.klaruk.com';
      expect(getAuthHost()).toBe('https://auth.klaruk.com');
      delete process.env.NEXTAUTH_URL;
    });

    it('should return default localhost if NEXTAUTH_URL not set', () => {
      delete process.env.NEXTAUTH_URL;
      expect(getAuthHost()).toBe('http://localhost:3000');
    });
  });
});

// Import crypto for the expired state test
import crypto from 'crypto';
