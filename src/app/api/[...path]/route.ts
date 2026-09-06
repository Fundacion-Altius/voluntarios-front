import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = `${API_URL}${path}${search}`;

  const headers = new Headers(request.headers);
  const incomingHost = headers.get('host');
  headers.delete('host');
  // Node fetch decompresses the upstream body; never ask for (or advertise) compression.
  headers.set('accept-encoding', 'identity');
  if (incomingHost) {
    headers.set('x-forwarded-host', incomingHost);
  }

  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.text()
    : undefined;

  const res = await fetch(url, {
    method: request.method,
    headers,
    body: body as BodyInit | undefined,
  });

  const responseHeaders = new Headers(res.headers);
  // Hop-by-hop / encoding headers are invalid after Node has already decoded the body.
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
