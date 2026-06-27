'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { setAuthToken } from '../lib/csrf';

function AuthTokenSetter({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  useEffect(() => {
    setAuthToken((session as any)?.authToken ?? null);
  }, [session]);
  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthTokenSetter>{children}</AuthTokenSetter>
    </SessionProvider>
  );
}
