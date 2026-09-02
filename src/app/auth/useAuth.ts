'use client';
import { signIn, signOut, useSession } from 'next-auth/react';
import { clearHadSession } from './AuthProvider';

function getDefaultCallbackUrl(user: any): string {
  return user?.role === 'general' ? '/portal' : '/admin/dashboard';
}

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;

  return {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login: (provider?: string) =>
      signIn(provider || 'credentials', { callbackUrl: getDefaultCallbackUrl(user) }),
    logout: () => {
      clearHadSession();
      return signOut({ callbackUrl: '/login' });
    },
  };
}
