import { type NextRequest, NextResponse } from 'next/server';
import { copyUpstreamCookies } from '@/lib/copyUpstreamCookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const csrfToken = request.headers.get('x-csrf-token') || request.cookies.get('csrf_token')?.value || '';

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Forwarded-Host': request.headers.get('host') || '',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });
  copyUpstreamCookies(res, response);
  return response;
}
