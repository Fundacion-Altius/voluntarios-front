'use client';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useAuthGate } from '@/app/auth/useAuthGate';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/portal/Sidebar';
import BottomNav from '@/components/portal/BottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { RoutePendingProvider } from '@/components/navigation/RoutePending';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout, status } = useAuthGate();
  const router = useRouter();
  const pathname = usePathname();
  const isStaffAllowedPortal =
    (pathname?.includes('/portal/sala') ?? false)
    || (pathname?.includes('/portal/mensajes') ?? false);
  const isProjectBoard = /\/portal\/proyectos\/(?!nuevo$|mensajes)[^/]+$/.test(pathname || '');

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated') return;
    if (isAuthenticated && (user as any)?.role !== 'general' && !isStaffAllowedPortal) {
      router.push('/admin/dashboard');
    }
  }, [status, isAuthenticated, user, router, isStaffAllowedPortal]);

  if (isLoading || status === 'unauthenticated') {
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
    <RoutePendingProvider>
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">
        <Sidebar
          userName={profile?.name}
          userEmail={profile?.email}
          onLogout={() => logout()}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-20 lg:p-6 lg:pb-6">
          <div className={isProjectBoard ? 'mx-auto min-w-0 max-w-[90rem]' : 'mx-auto max-w-5xl'}>
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
    </RoutePendingProvider>
  );
}
