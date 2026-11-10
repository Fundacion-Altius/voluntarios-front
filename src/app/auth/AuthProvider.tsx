'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { setAuthToken } from '../lib/csrf';

const HAD_SESSION_KEY = 'klaruk-had-session';
const REFRESH_MS = 10 * 60 * 1000;

export function markHadSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(HAD_SESSION_KEY, '1');
}

export function clearHadSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(HAD_SESSION_KEY);
}

export function hadSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(HAD_SESSION_KEY) === '1';
}

function AuthTokenSetter({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const updateRef = useRef(update);
  const tokenRef = useRef<string | null>(null);
  updateRef.current = update;

  useEffect(() => {
    const next = (session as { authToken?: string } | null)?.authToken ?? null;
    tokenRef.current = next;
    setAuthToken(next);
    if (status === 'authenticated') markHadSession();
  }, [session, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    let inFlight = false;

    const refresh = async () => {
      if (inFlight || cancelled) return;
      inFlight = true;
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (!res.ok || cancelled) return;
        const data = (await res.json().catch(() => ({}))) as { authToken?: string };
        if (!data.authToken || data.authToken === tokenRef.current) return;
        tokenRef.current = data.authToken;
        setAuthToken(data.authToken);
        await updateRef.current({ authToken: data.authToken });
      } finally {
        inFlight = false;
      }
    };

    const id = window.setInterval(() => void refresh(), REFRESH_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [status]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthTokenSetter>{children}</AuthTokenSetter>
    </SessionProvider>
  );
}
