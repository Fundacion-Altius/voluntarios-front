'use client';

import { useRouter } from '@/i18n/navigation';
import { useAuthGate } from '@/app/auth/useAuthGate';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminBottomNav from '@/components/admin/AdminBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { ChatbotDrawer } from '@/components/chat/ChatbotDrawer';
import { RoutePendingProvider } from '@/components/navigation/RoutePending';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout, status } = useAuthGate();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated') return;
    if (isAuthenticated && (user as { role?: string } | null)?.role === 'general') {
      router.push('/portal');
    }
  }, [status, isAuthenticated, user, router]);

  if (isLoading || status === 'unauthenticated') {
    return (
      <main className="min-h-screen bg-background p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const profile = user as { name?: string; email?: string; role?: string } | null;
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-5xl p-4 lg:p-6">{children}</main>
        <div className="fixed right-4 top-4 z-50">
          <NotificationBell />
        </div>
        <ChatbotDrawer />
      </div>
    );
  }

  return (
    <RoutePendingProvider>
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">
        <AdminSidebar
          userName={profile?.name}
          userEmail={profile?.email}
          onLogout={() => logout()}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-20 lg:p-6 lg:pb-6">
          <div className="mx-auto min-w-0 max-w-[90rem]">{children}</div>
        </main>
      </div>
      <div className="lg:hidden">
        <AdminBottomNav
          userName={profile?.name}
          userEmail={profile?.email}
          onLogout={() => logout()}
        />
      </div>
      <div className="fixed right-4 top-4 z-50">
        <NotificationBell />
      </div>
      <ChatbotDrawer />
    </div>
    </RoutePendingProvider>
  );
}
