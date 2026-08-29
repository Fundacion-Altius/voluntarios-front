'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';

type SessionRow = {
  id: string;
  shift?: string;
  capacity?: number;
  date?: string;
  is_cancelled?: string;
};

async function sessionHasActiveRoom(sessionId: string): Promise<boolean> {
  try {
    const data = await apiClient<{ data?: { roomId?: string }[] }>(
      apiUrl(`/api/video/rooms?activity_session_id=${sessionId}`),
    );
    return Boolean((data.data || [])[0]?.roomId);
  } catch {
    return false;
  }
}

async function fetchRoomPresence(sessions: SessionRow[]): Promise<Map<string, boolean>> {
  const presence = new Map<string, boolean>();
  const live = sessions.filter((s) => s.is_cancelled !== 'true');
  const flags = await Promise.all(live.map((s) => sessionHasActiveRoom(s.id)));
  live.forEach((s, i) => presence.set(s.id, flags[i]));
  return presence;
}

export default function ActividadesPortalPage() {
  const t = useTranslations('portal.actividades');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [hasRoomBySession, setHasRoomBySession] = useState<Map<string, boolean>>(new Map());
  const [joinLoadingId, setJoinLoadingId] = useState<string | null>(null);
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
      const data = await apiClient<SessionRow[]>(apiUrl('/api/activities/upcoming'));
      if (thisFetchId !== fetchIdRef.current) return;
      setSessions(data);
      const presence = await fetchRoomPresence(data);
      if (thisFetchId === fetchIdRef.current) setHasRoomBySession(presence);
    } catch (err: unknown) {
      if (thisFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (thisFetchId === fetchIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleJoinLive = async (sessionId: string) => {
    setJoinError(null);
    setJoinLoadingId(sessionId);
    try {
      const data = await apiClient<{ data?: { roomId?: string }[] }>(
        apiUrl(`/api/video/rooms?activity_session_id=${sessionId}`),
      );
      const room = (data.data || [])[0];
      if (room?.roomId) {
        window.location.href = `/portal/sala/${room.roomId}`;
      } else {
        setJoinError(t('noSalaActiva'));
      }
    } catch {
      setJoinError(t('noSalaActiva'));
    } finally {
      setJoinLoadingId(null);
    }
  };

  const handleBook = async (sessionId: string) => {
    setBookingId(sessionId);
    try {
      await apiClient(apiUrl(`/api/activities/sessions/${sessionId}/book`), { method: 'POST' });
      showSuccess(t('reservaConfirmada'));
      fetchSessions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBookingId(null); }
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
          {sessions.map((s) => {
            const cancelled = s.is_cancelled === 'true';
            const hasRoom = hasRoomBySession.get(s.id) === true;
            const joining = joinLoadingId === s.id;
            return (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{s.shift || t('sesion')}</CardTitle>
                    <Badge variant="outline">{s.capacity} {t('plazas')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{s.date ? new Date(s.date).toLocaleDateString() : ''}</p>
                  <p className="text-xs text-muted-foreground">{cancelled ? t('cancelada') : t('disponible')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!cancelled && (
                      <Button size="sm" onClick={() => handleBook(s.id)} disabled={bookingId === s.id}>
                        {bookingId === s.id ? t('reservando') : t('reservar')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!hasRoom || joining}
                      className={!hasRoom ? 'opacity-50' : undefined}
                      onClick={() => handleJoinLive(s.id)}
                    >
                      {joining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('uniendose')}</> : t('unirseClase')}
                    </Button>
                  </div>
                  {!hasRoom && !cancelled && (
                    <p className="mt-2 text-xs text-muted-foreground">{t('noSalaActiva')}</p>
                  )}
                  {!cancelled && (
                    <p className="mt-2 text-xs text-muted-foreground">{t('bookJoinHint')}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
