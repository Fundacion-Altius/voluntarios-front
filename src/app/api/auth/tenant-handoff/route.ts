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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error';
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  // Validate required parameters
  if (!state) {
    console.error('Tenant handoff: missing state parameter');
    return NextResponse.redirect(
      new URL('/login?error=missing_state', request.url)
    );
  }

  // Verify the state parameter
  const verifiedState = verifySignedState(state);
  if (!verifiedState) {
    console.error('Tenant handoff: invalid state parameter');
    return NextResponse.redirect(
      new URL('/login?error=invalid_state', request.url)
    );
  }

  const { tenant, returnTo } = verifiedState;

  // Verify that we're on an auth host
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (!isAuthHost(host)) {
    console.error(`Tenant handoff: not on auth host (${host})`);
    return NextResponse.redirect(
      new URL('/login?error=not_auth_host', request.url)
    );
  }

  try {
    // Get the session from NextAuth on the auth host
    // The OAuth callback should have already established a session
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      console.error('Tenant handoff: no session found after OAuth callback');
      return NextResponse.redirect(
        new URL('/login?error=no_session', request.url)
      );
    }

    // Extract user data from session
    const userData = {
      id: session.sub || '',
      email: session.email || '',
      name: session.name || '',
      role: session.role as string | undefined,
      user_type: session.user_type as string | undefined,
    };

    // Create handoff token with 5-minute expiry
    const handoffPayload = {
      user: userData,
      authToken: session.authToken || '',
      csrfToken: session.csrfToken,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    };

    const handoffToken = createHandoffToken(handoffPayload);

    // Determine the tenant host URL
    // For local development: {tenant}.localhost:3000
    // For production: {tenant}.klaruk.com
    const authHost = getAuthHost();
    const isProduction = authHost.includes('klaruk.com');
    const tenantHost = isProduction
      ? `${tenant}.klaruk.com`
      : `${tenant}.localhost:3000`;

    // Build the URL to redirect to on the tenant host
    const tenantUrl = new URL(`http://${tenantHost}/api/auth/receive-handoff`);
    tenantUrl.searchParams.set('token', handoffToken);
    tenantUrl.searchParams.set('return_to', returnTo);

    console.log(`Tenant handoff: redirecting to ${tenantUrl.toString()}`);

    return NextResponse.redirect(tenantUrl);

  } catch (error) {
    console.error('Tenant handoff error:', error);
    return NextResponse.redirect(
      new URL('/login?error=handoff_failed', request.url)
    );
  }
}

// Handle POST requests as well (some OAuth providers might use POST)
export async function POST(request: Request) {
  return GET(request);
}
