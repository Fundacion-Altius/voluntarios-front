'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

function getDefaultCallbackUrl(user: any): string {
  return user?.role === 'general' ? '/portal' : '/admin/dashboard';
}

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login: (provider?: string) =>
      signIn(provider || 'credentials', { callbackUrl: getDefaultCallbackUrl(user) }),
    logout: () => signOut({ callbackUrl: '/login' }),
  };
}
