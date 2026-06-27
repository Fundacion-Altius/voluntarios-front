'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login: (provider?: string) =>
      signIn(provider || 'azure-ad', { callbackUrl: '/dashboard' }),
    logout: () => signOut({ callbackUrl: '/login' }),
  };
}
