/**
 * Auth State Management Utilities
 * 
 * Provides signed state parameter creation and verification for OAuth flows
 * in the Central Auth Host pattern. This ensures tenant context is securely
 * passed through the OAuth flow and cannot be tampered with.
 */

import crypto from 'node:crypto';
import { KNOWN_TENANT_SLUGS } from './tenantHost';

/**
 * State payload for OAuth flows
 */
export interface AuthStatePayload {
  tenant: string;
  returnTo: string;
  timestamp: number;
}

/**
 * Verified state result
 */
export interface VerifiedAuthState {
  tenant: string;
  returnTo: string;
}

/**
 * Configuration for state management
 */
export interface AuthStateConfig {
  secret: string;
  stateExpiryMs: number; // Default: 5 minutes
}

// Default configuration
const DEFAULT_CONFIG: AuthStateConfig = {
  secret: process.env.NEXTAUTH_SECRET || '',
  stateExpiryMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Creates a signed state parameter for OAuth flows
 * 
 * @param tenant - The tenant slug (e.g., 'fundacionaltius')
 * @param returnTo - The URL to return to after auth (e.g., '/admin/dashboard')
 * @param config - Optional configuration (defaults to environment)
 * @returns Signed state string safe for URL parameters
 */
export function createSignedState(
  tenant: string,
  returnTo: string,
  config: AuthStateConfig = DEFAULT_CONFIG,
): string {
  if (!config.secret) {
    throw new Error('NEXTAUTH_SECRET is required for state signing');
  }

  // Validate tenant
  if (!KNOWN_TENANT_SLUGS.includes(tenant as typeof KNOWN_TENANT_SLUGS[number])) {
    throw new Error(`Unknown tenant: ${tenant}. Must be one of: ${KNOWN_TENANT_SLUGS.join(', ')}`);
  }

  // Validate returnTo is a safe path (no protocol, no absolute URL)
  if (!returnTo?.startsWith('/')) {
    throw new Error('returnTo must be a relative path starting with /');
  }

  const payload: AuthStatePayload = {
    tenant,
    returnTo,
    timestamp: Date.now(),
  };

  // Serialize payload
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');

  // Create signature
  const signature = crypto
    .createHmac('sha256', config.secret)
    .update(payloadString)
    .digest('hex');

  // Combine payload and signature
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies and extracts data from a signed state parameter
 * 
 * @param state - The signed state string from OAuth callback
 * @param config - Optional configuration (defaults to environment)
 * @returns Verified state data or null if verification fails
 */
export function verifySignedState(
  state: string,
  config: AuthStateConfig = DEFAULT_CONFIG,
): VerifiedAuthState | null {
  if (!(config.secret && state)) {
    return null;
  }

  try {
    // Split payload and signature
    const [payloadBase64, signature] = state.split('.');
    if (!(payloadBase64 && signature)) {
      return null;
    }

    // Deserialize payload
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: AuthStatePayload = JSON.parse(payloadString);

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', config.secret)
      .update(payloadString)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null; // Signature mismatch - possible tampering
    }

    // Verify timestamp is recent
    const age = Date.now() - payload.timestamp;
    if (age < 0 || age > config.stateExpiryMs) {
      return null; // Expired or future timestamp
    }

    // Verify tenant is known
    if (!KNOWN_TENANT_SLUGS.includes(payload.tenant as typeof KNOWN_TENANT_SLUGS[number])) {
      return null; // Unknown tenant
    }

    // Verify returnTo is a safe path
    if (!payload.returnTo?.startsWith('/')) {
      return null; // Invalid returnTo
    }

    return {
      tenant: payload.tenant,
      returnTo: payload.returnTo,
    };
  } catch {
    return null; // Any parsing or verification error
  }
}

/**
 * Handoff token for cross-host session establishment
 */
export interface HandoffTokenPayload {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    user_type?: string;
  };
  authToken: string;
  csrfToken?: string;
  expires: number; // Unix timestamp
}

/**
 * Creates a signed handoff token for tenant session establishment
 * 
 * @param payload - The handoff token data
 * @param config - Optional configuration (defaults to environment)
 * @returns Signed token string safe for URL parameters
 */
export function createHandoffToken(
  payload: HandoffTokenPayload,
  config: AuthStateConfig = DEFAULT_CONFIG,
): string {
  if (!config.secret) {
    throw new Error('NEXTAUTH_SECRET is required for token signing');
  }

  // Serialize payload
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString, 'utf-8').toString('base64url');

  // Create signature
  const signature = crypto
    .createHmac('sha256', config.secret)
    .update(payloadString)
    .digest('hex');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies and extracts data from a signed handoff token
 * 
 * @param token - The signed token string
 * @param config - Optional configuration (defaults to environment)
 * @returns Verified token data or null if verification fails
 */
export function verifyHandoffToken(
  token: string,
  config: AuthStateConfig = DEFAULT_CONFIG,
): HandoffTokenPayload | null {
  if (!(config.secret && token)) {
    return null;
  }

  try {
    // Split payload and signature
    const [payloadBase64, signature] = token.split('.');
    if (!(payloadBase64 && signature)) {
      return null;
    }

    // Deserialize payload
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: HandoffTokenPayload = JSON.parse(payloadString);

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', config.secret)
      .update(payloadString)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null; // Signature mismatch
    }

    // Verify token is not expired
    if (Date.now() > payload.expires) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null; // Any parsing or verification error
  }
}

/**
 * Helper to check if a host is an auth host
 */
export function isAuthHost(host: string | null | undefined): boolean {
  if (!host) return false;
  
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, '');
  const authHosts = [
    'localhost',
    '127.0.0.1',
    'auth.klaruk.com',
  ];
  
  return authHosts.includes(normalizedHost);
}

/**
 * Helper to get the auth host URL for the current environment
 */
export function getAuthHost(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}
