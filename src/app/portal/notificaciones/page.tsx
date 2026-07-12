'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  status: string;
  created_at: string;
}

interface PageData {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export default function NotificacionesPage() {
  const { data: session } = useSession();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const mountedRef = useRef(true);

  const authToken = (session as any)?.authToken;

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error loading');
      const data = await res.json();
      if (mountedRef.current) setPageData(data);
    } catch {
      // silent
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [authToken, page]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    return () => { mountedRef.current = false; };
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!authToken) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      setPageData((prev) =>
        prev
          ? { ...prev, data: prev.data.map((n) => (n.id === id ? { ...n, status: 'read' } : n)) }
          : prev,
      );
    } catch {
      // silent
    }
  };

  const totalPages = pageData ? Math.ceil(pageData.total / pageData.limit) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notificaciones</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : pageData && pageData.data.length > 0 ? (
        <>
          <div className="space-y-2">
            {pageData.data.map((n) => (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${n.status === 'unread' ? 'border-l-primary border-l-4' : ''}`}
                onClick={() => handleMarkRead(n.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tienes notificaciones
          </CardContent>
        </Card>
      )}
    </div>
  );
}
