'use client';

import React from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/NotificationBell';

interface TopBarProps {
  hamburger?: React.ReactNode;
}

export function TopBar({ hamburger }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b bg-muted/50 px-6 py-3">
      <div className="flex items-center gap-3">
        {hamburger}
        <span className="font-semibold">Fundación Altius - Panel de Administración</span>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <ThemeToggle />
        {user ? (
          <span className="text-sm text-muted-foreground">
            {user.name} ({user.email})
          </span>
        ) : (
          <Skeleton className="h-4 w-48" />
        )}
        <Button variant="destructive" size="sm" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </nav>
  );
}
