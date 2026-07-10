'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/auth/useAuth';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { TopBar } from '@/components/ui/topbar';
import { LayoutDashboard, Users, FileText, ClipboardList, BarChart3, UserCheck, CalendarCheck, Trophy, Scan } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
          <Skeleton className="h-8 w-48" />
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

  const isAdmin = (user as any)?.role === 'admin';

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/contratos', label: 'Contratos', icon: FileText },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/admin/encuestas', label: 'Encuestas', icon: ClipboardList },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/candidatos', label: 'Candidatos', icon: UserCheck },
    { href: '/admin/actividades', label: 'Actividades', icon: CalendarCheck },
    { href: '/admin/scanner', label: 'Escáner', icon: Scan },
    { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      {isAdmin ? (
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <Sidebar>
              <SidebarHeader className="p-4">
                <span className="text-lg font-bold">Admin Panel</span>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={item.href}>
                                <Icon className="size-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <div className="flex min-h-screen flex-col">
          <TopBar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      )}
    </div>
  );
}
