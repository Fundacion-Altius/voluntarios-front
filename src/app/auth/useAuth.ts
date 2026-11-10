'use client';
import { signIn, useSession } from 'next-auth/react';
import { clearHadSession } from './AuthProvider';
import { useRouter } from '@/i18n/navigation';

function getDefaultCallbackUrl(user: any): string {
  return user?.role === 'general' ? '/portal' : '/admin/dashboard';
}

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();

  return {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login: (provider?: string) =>
      signIn(provider || 'credentials', { callbackUrl: getDefaultCallbackUrl(user) }),
    logout: async () => {
      clearHadSession();
      try {
        const csrfRes = await fetch('/api/auth/csrf');
        const { csrfToken } = await csrfRes.json();
        const callbackUrl = `${window.location.origin}/es/login`;
        const res = await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ csrfToken, callbackUrl }),
          redirect: 'manual',
        });
        if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 200) {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    },
  };
}
