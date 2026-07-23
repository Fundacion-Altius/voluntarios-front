'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRealtimeNotification, type RealtimeNotification } from '@/hooks/useRealtimeNotification';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const router = useRouter();

  const authToken = (session as any)?.authToken;

  useRealtimeNotification({
    authToken,
    onNotification: useCallback((n: RealtimeNotification) => {
      setNotifications((prev) => {
        if (prev.some((existing) => existing.id === n.id)) return prev;
        return [{ ...n, status: 'unread' }, ...prev].slice(0, 5);
      });
      setUnreadCount((prev) => prev + 1);
    }, []),
  });

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications?filter=unread&limit=5`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!mountedRef.current) return;
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }, [authToken]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    intervalRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!authToken) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    if (!authToken) return;
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    handleMarkRead(n.id);

    if (n.type === 'video_call_started' || n.type === 'video_call_ended') {
      try {
        const metadata = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
        const roomId = metadata?.roomId;
        if (roomId) {
          router.push(`/portal/sala/${roomId}`);
          return;
        }
      } catch {}
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {notifications.length > 0 && (
            <button type="button" className="text-xs text-primary hover:underline" onClick={handleMarkAllRead}>
              Marcar todas leídas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No tienes notificaciones nuevas
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-1 py-3"
              onClick={() => handleNotificationClick(n)}
            >
              <span className="text-sm font-medium">{n.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
