import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { resolveTenantHost, isAuthHost } from '@/lib/tenantHost';

const intlMiddleware = createMiddleware(routing);

// Klaruk marketing pages ((marketing) route group) belong to the root Klaruk
// host only. On tenant hosts, / and /planes go to the contract wizard instead.
const MARKETING_PATH = /^\/(?:(es|ca|en)(?:\/|$))?(?:planes\/?)?$/;

function tenantMarketingRedirect(request: NextRequest): NextResponse | null {
  const match = MARKETING_PATH.exec(request.nextUrl.pathname);
  if (!match) return null;
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = match[1]
    ?? (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale) ? cookieLocale : routing.defaultLocale);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/contrato`;
  return NextResponse.redirect(url);
}

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

function gateResponse(verdict: Awaited<ReturnType<typeof resolveTenantHost>>, request: NextRequest): NextResponse | null {
  if (verdict.known === false) {
    return new NextResponse('Not Found', { status: 404 });
  }
  if (verdict.known === true && !verdict.active) {
    return new NextResponse(`Tenant ${verdict.status}`, { status: 403 });
  }
  if (verdict.known === null && verdict.failClosed) {
    return new NextResponse('Service Unavailable', { status: 503 });
  }
  if (verdict.known === true) {
    return tenantMarketingRedirect(request);
  }
  return null;
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
  // 403 (mirrors the backend resolver). Hosts the backend can't reach fail
  // closed with 503 — the backend resolver is the authoritative gate, and an
  // outage must not silently allow traffic. Hosts with no tenant slug (apex,
  // localhost) are not failures; they pass through with failClosed: false.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const verdict = await resolveTenantHost(host);
  const gated = gateResponse(verdict, request);
  if (gated) return gated;
  return intlMiddleware(request);
}

export const config = {
  // Matcher ignoring _next, api, ws (mediasoup/realtime), and files with extensions
  // Route matcher config constant, equivalent mutants only — excluded from mutation scope.
  // Stryker disable next-line StringLiteral, ArrayDeclaration
  matcher: ['/((?!api|_next|_vercel|ws(?:/.*)?|.*\\..*).*)'],
};
