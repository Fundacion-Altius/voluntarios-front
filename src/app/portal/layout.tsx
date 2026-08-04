'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/auth/useAuth';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/portal/Sidebar';
import BottomNav from '@/components/portal/BottomNav';
import { NotificationBell } from '@/components/NotificationBell';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isSalaRoute = pathname?.startsWith('/portal/sala') ?? false;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && isAuthenticated && (user as any)?.role !== 'general' && !isSalaRoute) {
      router.push('/admin/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router, isSalaRoute]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const profile = user as { name?: string; email?: string } | null;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">
        <Sidebar
          userName={profile?.name}
          userEmail={profile?.email}
          onLogout={() => logout()}
        />
      </div>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
      <div className="lg:hidden">
        <BottomNav
          userName={profile?.name}
          userEmail={profile?.email}
          onLogout={() => logout()}
        />
      </div>
      <div className="fixed right-4 top-4 z-50">
        <NotificationBell />
      </div>
    </div>
  );
}
