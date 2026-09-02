import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { should404UnknownTenantHost } from '@/lib/tenantHost';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/ws')) {
    return NextResponse.next();
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (should404UnknownTenantHost(host)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  return intlMiddleware(request);
}

export const config = {
  // Matcher ignoring _next, api, ws (mediasoup/realtime), and files with extensions
  // Route matcher config constant, equivalent mutants only — excluded from mutation scope.
  // Stryker disable next-line StringLiteral, ArrayDeclaration
  matcher: ['/((?!api|_next|_vercel|ws(?:/.*)?|.*\\..*).*)'],
};
