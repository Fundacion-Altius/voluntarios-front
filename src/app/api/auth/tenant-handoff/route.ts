/**
 * Tenant Handoff Endpoint
 * 
 * This endpoint runs on the auth host (localhost:3000 or auth.klaruk.com) and handles
 * the OAuth callback from Azure AD. It validates the state parameter, retrieves the
 * session from NextAuth, creates a short-lived handoff token, and redirects to the
 * tenant host to establish the session there.
 */

import { NextResponse } from 'next/server';
import { verifySignedState, createHandoffToken, getAuthHost, isAuthHost } from '@/lib/authState';
import { getToken } from 'next-auth/jwt';

/**
 * Validates the OAuth callback request parameters
 */
function validateOAuthCallback(searchParams: URLSearchParams): {
  state: string;
} | { error: string; errorDescription: string } {
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error';
    return { error, errorDescription };
  }

  // Validate required parameters
  if (!state) {
    return { error: 'missing_state', errorDescription: 'Missing state parameter' };
  }

  return { state };
}

/**
 * Validates the state parameter and extracts tenant info
 */
function validateAndExtractState(state: string): { tenant: string; returnTo: string } | null {
  const verifiedState = verifySignedState(state);
  if (!verifiedState) {
    console.error('Tenant handoff: invalid state parameter');
    return null;
  }

  return verifiedState;
}

/**
 * Validates that the request is coming from an auth host
 */
function validateAuthHost(request: Request): boolean {
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (!isAuthHost(host)) {
    console.error(`Tenant handoff: not on auth host (${host})`);
    return false;
  }
  return true;
}

/**
 * Extracts user data from NextAuth session
 */
function extractUserDataFromSession(session: Record<string, any>) {
  return {
    id: session.sub || '',
    email: session.email || '',
    name: session.name || '',
    role: session.role as string | undefined,
    user_type: session.user_type as string | undefined,
  };
}

/**
 * Creates a handoff token payload
 */
function createHandoffPayload(userData: Record<string, any>, session: Record<string, any>): object {
  return {
    user: userData,
    authToken: session.authToken || '',
    csrfToken: session.csrfToken,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes from now
  };
}

/**
 * Builds the tenant host URL for redirect
 */
function buildTenantHostUrl(tenant: string, handoffToken: string, returnTo: string): URL {
  const authHost = getAuthHost();
  const isProduction = authHost.includes('klaruk.com');
  const tenantHost = isProduction
    ? `${tenant}.klaruk.com`
    : `${tenant}.localhost:3000`;

  const tenantUrl = new URL(`http://${tenantHost}/api/auth/receive-handoff`);
  tenantUrl.searchParams.set('token', handoffToken);
  tenantUrl.searchParams.set('return_to', returnTo);

  return tenantUrl;
}

/**
 * Handles OAuth errors by redirecting to login with error info
 */
function handleOAuthError(error: string, errorDescription: string, requestUrl: string): NextResponse {
  console.error('OAuth error:', error, errorDescription);
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`, requestUrl)
  );
}

/**
 * Handles validation errors by redirecting to login
 */
function handleValidationError(error: string, requestUrl: string): NextResponse {
  console.error(`Tenant handoff: ${error}`);
  return NextResponse.redirect(
    new URL(`/login?error=${error}`, requestUrl)
  );
}

/**
 * Handles general errors during the handoff process
 */
function handleHandoffError(error: unknown, requestUrl: string): NextResponse {
  console.error('Tenant handoff error:', error);
  return NextResponse.redirect(
    new URL('/login?error=handoff_failed', requestUrl)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Validate OAuth callback parameters
  const validationResult = validateOAuthCallback(searchParams, request.url);
  if ('error' in validationResult && validationResult.error) {
    return handleOAuthError(validationResult.error, validationResult.errorDescription, request.url);
  }

  // Extract and validate state
  const verifiedState = validateAndExtractState(validationResult.state);
  if (!verifiedState) {
    return handleValidationError('invalid_state', request.url);
  }

  const { tenant, returnTo } = verifiedState;

  // Verify we're on an auth host
  if (!validateAuthHost(request)) {
    return handleValidationError('not_auth_host', request.url);
  }

  try {
    // Get session from NextAuth
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return handleValidationError('no_session', request.url);
    }

    // Extract user data and create handoff token
    const userData = extractUserDataFromSession(session);
    const handoffPayload = createHandoffPayload(userData, session);
    const handoffToken = createHandoffToken(handoffPayload);

    // Build and redirect to tenant host
    const tenantUrl = buildTenantHostUrl(tenant, handoffToken, returnTo);
    console.log(`Tenant handoff: redirecting to ${tenantUrl.toString()}`);

    return NextResponse.redirect(tenantUrl);

  } catch (error) {
    return handleHandoffError(error, request.url);
  }
}

// Handle POST requests as well (some OAuth providers might use POST)
export async function POST(request: Request) {
  return GET(request);
}