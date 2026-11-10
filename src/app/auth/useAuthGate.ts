'use client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { hadSession } from './AuthProvider';
import { useAuth } from './useAuth';

export function useAuthGate() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'loading') return;
    if (auth.status === 'authenticated') return;
    const graceMs = hadSession() ? 2000 : 0;
    const id = window.setTimeout(() => {
      router.push('/login');
    }, graceMs);
    return () => window.clearTimeout(id);
  }, [auth.status, router]);

  return auth;
}
