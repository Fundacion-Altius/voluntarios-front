/**
 * Receive Handoff Endpoint
 * 
 * This endpoint runs on tenant hosts ({slug}.localhost:3000 or {slug}.klaruk.com)
 * and receives the handoff token from the auth host. It validates the token,
 * creates a NextAuth session on the tenant host, and sets a host-only session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyHandoffToken, isAuthHost, type HandoffTokenPayload } from '@/lib/authState';
import { encode } from 'next-auth/jwt';

/**
 * Validates the handoff request parameters
 */
function validateHandoffParams(searchParams: URLSearchParams): {
  token: string;
  returnTo: string;
} | { error: string } {
  const token = searchParams.get('token');

  if (!token) {
    return { error: 'missing_token' };
  }

  const returnTo = searchParams.get('return_to') || '/';
  return { token, returnTo };
}

/**
 * Validates the handoff token and checks expiry
 */
function validateHandoffTokenData(token: string): HandoffTokenPayload | { error: string } {
  const handoffPayload = verifyHandoffToken(token);
  if (!handoffPayload) {
    return { error: 'invalid_token' };
  }

  // Check if token is expired
  if (Date.now() > handoffPayload.expires) {
    return { error: 'token_expired' };
  }

  return handoffPayload;
}

/**
 * Validates that we're on a tenant host (not auth host)
 */
function validateTenantHost(request: NextRequest): boolean {
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (isAuthHost(host)) {
    console.error(`Receive handoff: should not be on auth host (${host})`);
    return false;
  }
  return true;
}

/**
 * Creates a NextAuth session token from handoff payload
 */
async function createSessionToken(handoffPayload: HandoffTokenPayload): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required');
  }

  return encode({
    token: {
      name: handoffPayload.user.name,
      email: handoffPayload.user.email,
      sub: handoffPayload.user.id,
      role: handoffPayload.user.role,
      user_type: handoffPayload.user.user_type,
      csrfToken: handoffPayload.csrfToken,
      authToken: handoffPayload.authToken,
    },
    secret,
  });
}

/**
 * Builds the response with session cookies
 */
function buildSessionResponse(
  returnTo: string,
  request: NextRequest,
  sessionToken: string,
  csrfToken: string | undefined
): NextResponse {
  const response = NextResponse.redirect(new URL(returnTo, request.url));

  // Set the session cookie (host-only)
  response.cookies.set('next-auth.session-token', sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Set CSRF token cookie if present
  if (csrfToken) {
    response.cookies.set('next-auth.csrf-token', csrfToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  return response;
}

/**
 * Handles validation errors
 */
function handleValidationError(error: string, requestUrl: string): NextResponse {
  console.error(`Receive handoff: ${error}`);
  return NextResponse.redirect(
    new URL(`/login?error=${error}`, requestUrl)
  );
}

/**
 * Handles general errors
 */
function handleReceiveError(error: unknown, requestUrl: string): NextResponse {
  console.error('Receive handoff error:', error);
  return NextResponse.redirect(
    new URL('/login?error=session_creation_failed', requestUrl)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Validate request parameters
    const params = validateHandoffParams(searchParams);
    if ('error' in params) {
      return handleValidationError(params.error, request.url);
    }

    // Validate handoff token
    const handoffPayload = validateHandoffTokenData(params.token);
    if ('error' in handoffPayload) {
      return handleValidationError(handoffPayload.error, request.url);
    }

    // Verify we're on a tenant host
    if (!validateTenantHost(request)) {
      return handleValidationError('on_auth_host', request.url);
    }

    // Create session token
    const sessionToken = await createSessionToken(handoffPayload);

    // Build and return response with cookies
    const response = buildSessionResponse(
      params.returnTo,
      request,
      sessionToken,
      handoffPayload.csrfToken
    );

    console.log(`Receive handoff: session established for ${handoffPayload.user.email} on ${request.headers.get('host')}`);

    return response;

  } catch (error) {
    return handleReceiveError(error, request.url);
  }
}

// Handle POST requests as well
export async function POST(request: NextRequest) {
  return GET(request);
}
