'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

interface NotificationItem {
  id: string; title: string; body: string; type: string;
  status: string; created_at: string;
}

export default function NotificacionesPage() {
  const { data: session } = useSession();
  const [pageData, setPageData] = useState<{ data: NotificationItem[]; total: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient<{ data: NotificationItem[]; total: number; page: number; limit: number }>(apiUrl(`/api/notifications?page=${page}&limit=20`));
      if (mountedRef.current) setPageData(data);
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, session]);

  useEffect(() => { mountedRef.current = true; fetchNotifications(); return () => { mountedRef.current = false; }; }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient<any>(apiUrl(`/api/notifications/${id}/read`), { method: 'PUT' });
      setPageData((prev) => prev ? { ...prev, data: prev.data.map((n) => (n.id === id ? { ...n, status: 'read' } : n)) } : prev);
    } catch { /* silent */ }
  };

  const totalPages = pageData ? Math.ceil(pageData.total / pageData.limit) : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Notificaciones" />
      {loading ? <LoadingSkeleton rows={5} /> : error ? <ErrorState message={error} /> : pageData && pageData.data.length > 0 ? (
        <>
          <div className="space-y-2">
            {pageData.data.map((n) => (
              <Card key={n.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${n.status === 'unread' ? 'border-l-4 border-l-primary' : ''}`} onClick={() => handleMarkRead(n.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="No tienes notificaciones" />
      )}
    </div>
  );
}
