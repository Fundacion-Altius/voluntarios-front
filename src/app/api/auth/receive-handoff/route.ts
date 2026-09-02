/**
 * Receive Handoff Endpoint
 * 
 * This endpoint runs on tenant hosts ({slug}.localhost:3000 or {slug}.klaruk.com)
 * and receives the handoff token from the auth host. It validates the token,
 * creates a NextAuth session on the tenant host, and sets a host-only session cookie.
 */

import { NextResponse } from 'next/server';
import { verifyHandoffToken, isAuthHost } from '@/lib/authState';
import { encode } from 'next-auth/jwt';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const returnTo = searchParams.get('return_to') || '/';

  // Validate required parameters
  if (!token) {
    console.error('Receive handoff: missing token parameter');
    return NextResponse.redirect(
      new URL('/login?error=missing_token', request.url)
    );
  }

  // Verify the handoff token
  const handoffPayload = verifyHandoffToken(token);
  if (!handoffPayload) {
    console.error('Receive handoff: invalid token');
    return NextResponse.redirect(
      new URL('/login?error=invalid_token', request.url)
    );
  }

  // Check if token is expired
  if (Date.now() > handoffPayload.expires) {
    console.error('Receive handoff: token expired');
    return NextResponse.redirect(
      new URL('/login?error=token_expired', request.url)
    );
  }

  // Verify that we're NOT on an auth host (should be on tenant host)
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (isAuthHost(host)) {
    console.error(`Receive handoff: should not be on auth host (${host})`);
    return NextResponse.redirect(
      new URL('/login?error=on_auth_host', request.url)
    );
  }

  try {
    // Create a NextAuth session token for the tenant host
    // This mimics what NextAuth would create during a normal login flow
    const sessionToken = await encode({
      token: handoffPayload.authToken,
      user: {
        id: handoffPayload.user.id,
        email: handoffPayload.user.email,
        name: handoffPayload.user.name,
        role: handoffPayload.user.role,
        user_type: handoffPayload.user.user_type,
      },
      name: handoffPayload.user.name,
      email: handoffPayload.user.email,
      sub: handoffPayload.user.id,
      role: handoffPayload.user.role,
      user_type: handoffPayload.user.user_type,
      csrfToken: handoffPayload.csrfToken,
      authToken: handoffPayload.authToken,
    });

    // Build the response with the session cookie
    // The cookie is host-only (no Domain attribute) to maintain tenant isolation
    const response = NextResponse.redirect(new URL(returnTo, request.url));

    // Set the session cookie
    response.cookies.set('next-auth.session-token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // No domain attribute - makes it host-only
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Also set the CSRF token cookie if present
    if (handoffPayload.csrfToken) {
      response.cookies.set('next-auth.csrf-token', handoffPayload.csrfToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    console.log(`Receive handoff: session established for ${handoffPayload.user.email} on ${host}`);

    return response;

  } catch (error) {
    console.error('Receive handoff error:', error);
    return NextResponse.redirect(
      new URL('/login?error=session_creation_failed', request.url)
    );
  }
}

// Handle POST requests as well
export async function POST(request: Request) {
  return GET(request);
}
