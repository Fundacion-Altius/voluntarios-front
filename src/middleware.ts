import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { should404UnknownTenantHost } from '@/lib/tenantHost';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (should404UnknownTenantHost(host)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  return intlMiddleware(request);
}

export const config = {
  // Matcher ignoring _next, api, and files with extensions (manifest.json, sw.js, images)
  // Route matcher config constant, equivalent mutants only — excluded from mutation scope.
  // Stryker disable next-line StringLiteral, ArrayDeclaration
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
