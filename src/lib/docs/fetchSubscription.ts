import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Server-side subscription check for /docs gate.
 * Fail-open in development when the API is unreachable so local demos work.
 */
export async function fetchDocsSubscriptionActive(): Promise<{
  authenticated: boolean;
  active: boolean;
}> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    if (!cookieHeader) {
      return { authenticated: false, active: false };
    }

    const res = await fetch(`${API_URL}/api/billing/subscription-status`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.status === 401) {
      return { authenticated: false, active: false };
    }
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        return { authenticated: true, active: true };
      }
      return { authenticated: true, active: false };
    }
    const data = (await res.json()) as { active?: boolean };
    return { authenticated: true, active: Boolean(data.active) };
  } catch {
    if (process.env.NODE_ENV === 'development') {
      return { authenticated: true, active: true };
    }
    return { authenticated: false, active: false };
  }
}
