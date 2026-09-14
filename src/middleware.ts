import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { resolveTenantHost, isAuthHost } from '@/lib/tenantHost';

const intlMiddleware = createMiddleware(routing);

/**
 * Check if the request is for an auth host or handoff endpoint
 * These should bypass tenant validation
 */
function shouldBypassTenantCheck(request: NextRequest): boolean {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const pathname = request.nextUrl.pathname;
  
  // Allow auth hosts to bypass tenant checks
  if (isAuthHost(host)) {
    return true;
  }
  
  // Allow handoff endpoints to pass through from any host
  if (pathname.startsWith('/api/auth/tenant-handoff') || 
      pathname.startsWith('/api/auth/receive-handoff')) {
    return true;
  }
  
  return false;
}

export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/ws')) {
    return NextResponse.next();
  }

  // Platform control plane is tenantless and locale-less — skip tenant + intl handling.
  if (request.nextUrl.pathname.startsWith('/platform')) {
    return NextResponse.next();
  }

  // Check if this request should bypass tenant validation
  if (shouldBypassTenantCheck(request)) {
    return intlMiddleware(request);
  }

  // Backend-driven host gate: unknown slugs 404, suspended/archived slugs
  // 403 (mirrors the backend resolver). Unverifiable hosts (no slug parsed
  // or backend unreachable) fail closed with 503 — the backend resolver is
  // the authoritative gate, and an outage must not silently allow traffic.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const verdict = await resolveTenantHost(host);
  if (verdict.known === false) {
    return new NextResponse('Not Found', { status: 404 });
  }
  if (verdict.known === true && !verdict.active) {
    return new NextResponse(`Tenant ${verdict.status}`, { status: 403 });
  }
  if (verdict.known === null && verdict.failClosed) {
    return new NextResponse('Service Unavailable', { status: 503 });
  }
  return intlMiddleware(request);
}

export const config = {
  // Matcher ignoring _next, api, ws (mediasoup/realtime), and files with extensions
  // Route matcher config constant, equivalent mutants only — excluded from mutation scope.
  // Stryker disable next-line StringLiteral, ArrayDeclaration
  matcher: ['/((?!api|_next|_vercel|ws(?:/.*)?|.*\\..*).*)'],
};
