'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function ActividadesPortalPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.actividades');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const fetchSessions = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setLoading(true); setError(null);
    try {
      const data = await apiClient<any[]>(apiUrl('/api/activities/upcoming'));
      if (thisFetchId === fetchIdRef.current) setSessions(data);
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) setError(err.message);
    } finally {
      if (thisFetchId === fetchIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleJoinLive = async (sessionId: string) => {
    setJoinError(null);
    try {
      const data = await apiClient<any>(apiUrl(`/api/video/rooms?activity_session_id=${sessionId}`));
      const rooms = data.data || [];
      const room = rooms[0];
      if (room?.roomId) {
        window.location.href = `/portal/sala/${room.roomId}`;
      } else {
        setJoinError(t('noSalaActiva'));
      }
    } catch {
      setJoinError(t('noSalaActiva'));
    }
  };

  const handleBook = async (sessionId: string) => {
    setBookingId(sessionId);
    try {
      await apiClient<any>(apiUrl(`/api/activities/sessions/${sessionId}/book`), { method: 'POST' });
      showSuccess(t('reservaConfirmada'));
      fetchSessions();
    } catch (err: any) { setError(err.message); }
    finally { setBookingId(null); }
  };

  if (loading) return <div><PageHeader title={t('titulo')} subtitle={t('subtitulo')} /><LoadingSkeleton rows={3} /></div>;

  return (
    <div>
      <PageHeader title={t('titulo')} subtitle={t('subtitulo')} />
      {error && <ErrorState message={error} onRetry={fetchSessions} />}
      {joinError && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{joinError}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md bg-primary/10 p-3 text-sm text-primary">{successMsg}</div>
      )}
      {!error && sessions.length === 0 ? (
        <EmptyState title={t('noSesiones')} description={t('vuelveMasTarde')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sessions.map((s: any) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{s.shift || t('sesion')}</CardTitle>
                  <Badge variant="outline">{s.capacity} {t('plazas')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{s.is_cancelled === 'true' ? t('cancelada') : t('disponible')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.is_cancelled !== 'true' && (
                    <Button size="sm" onClick={() => handleBook(s.id)} disabled={bookingId === s.id}>
                      {bookingId === s.id ? t('reservando') : t('reservar')}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => handleJoinLive(s.id)}>
                    {t('unirseClase')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
