'use client';

import { useAuth } from '@/app/auth/useAuth';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if ((user as any)?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/contratos');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return null;
}
