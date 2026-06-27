'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/useAuth';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-between border-b bg-muted/50 px-6 py-3">
          <Skeleton className="h-6 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between border-b bg-muted/50 px-6 py-3">
        <span className="font-semibold">Fundación Altius - Panel de Administración</span>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">
            {user?.name} ({user?.email})
          </span>
          <Button variant="destructive" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
