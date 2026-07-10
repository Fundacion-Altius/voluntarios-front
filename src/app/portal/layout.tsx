'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/auth/useAuth';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Award, Trophy, LogOut } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const links = [
    { href: '/portal', label: 'Mi perfil', icon: Home },
    { href: '/portal/actividades', label: 'Actividades', icon: Calendar },
    { href: '/portal/logros', label: 'Logros', icon: Award },
    { href: '/portal/ranking', label: 'Ranking', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-bold">Mi Portal</span>
          <div className="flex items-center gap-2">
            {links.map((l) => {
              const Icon = l.icon;
              const isActive = pathname === l.href;
              return (
                <Link key={l.href} href={l.href}>
                  <Button variant={isActive ? 'default' : 'ghost'} size="sm">
                    <Icon className="mr-1 size-4" /> {l.label}
                  </Button>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="mr-1 size-4" /> Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
