'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ActividadesPortalPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {}; if (token) h['Authorization'] = `Bearer ${token}`; return h;
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const fetchSessions = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/activities/sessions/upcoming`, { headers: fetchHeaders(), credentials: 'include' });
      if (thisFetchId !== fetchIdRef.current) return;
      if (!res.ok) throw new Error('Error al cargar sesiones');
      const data = await res.json();
      setSessions(data.success ? data.data : data);
    } catch (err: any) { setError(err.message); }
    finally { if (thisFetchId === fetchIdRef.current) setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleBook = async (sessionId: string) => {
    setBookingId(sessionId);
    try {
      const res = await fetch(`${API_URL}/api/activities/sessions/${sessionId}/book`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...fetchHeaders() }, credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      showSuccess('Reserva confirmada');
      fetchSessions();
    } catch (err: any) { setError(err.message); }
    finally { setBookingId(null); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full rounded-lg" /></div>;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Próximas sesiones</h2>
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {successMsg && <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800">{successMsg}</div>}
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">No hay sesiones disponibles próximamente.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sessions.map((s: any) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{s.shift || 'Sesión'}</CardTitle>
                  <Badge variant="outline">{s.capacity} plazas</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{s.is_cancelled === 'true' ? 'Cancelada' : 'Disponible'}</p>
                {s.is_cancelled !== 'true' && (
                  <Button size="sm" className="mt-3" onClick={() => handleBook(s.id)} disabled={bookingId === s.id}>
                    {bookingId === s.id ? 'Reservando...' : 'Reservar'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
