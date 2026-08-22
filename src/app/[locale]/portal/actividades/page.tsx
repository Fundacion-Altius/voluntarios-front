'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

type CalendarEntry = {
  activityTypeId: string;
  name: string;
  category: string;
  localidad: string | null;
  date: string;
  shift: string;
  capacity: number;
  bookedCount: number;
  available: number;
  waitlistCount: number;
  isCancelled: boolean;
};

type MyBooking = {
  id: string;
  activity_type_id: string;
  name: string;
  localidad: string | null;
  date: string;
  shift: string;
  status: string;
};

type MyWaitlistEntry = {
  id: string;
  activity_type_id: string;
  name: string;
  localidad: string | null;
  date: string;
  shift: string;
  position: number;
  status: string;
  offer_expires_at: string | null;
};

export default function ActividadesPortalPage() {
  const t = useTranslations('portal.actividades');
  const [sessions, setSessions] = useState<CalendarEntry[]>([]);
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [waitlist, setWaitlist] = useState<MyWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyBooking | null>(null);
  const fetchIdRef = useRef(0);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const fetchAll = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setLoading(true); setError(null);
    try {
      const [calendar, myBookings, myWaitlist] = await Promise.all([
        apiClient<CalendarEntry[]>(apiUrl('/api/activities/upcoming')),
        apiClient<MyBooking[]>(apiUrl('/api/activities/my-bookings')).catch(() => [] as MyBooking[]),
        apiClient<MyWaitlistEntry[]>(apiUrl('/api/activities/my-waitlist')).catch(() => [] as MyWaitlistEntry[]),
      ]);
      if (thisFetchId === fetchIdRef.current) {
        setSessions(calendar);
        setBookings(myBookings);
        setWaitlist(myWaitlist);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) setError(err.message);
    } finally {
      if (thisFetchId === fetchIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const triple = (e: { activity_type_id?: string; activityTypeId?: string; date: string; shift: string }) =>
    `${e.activity_type_id ?? e.activityTypeId}-${e.date}-${e.shift}`;

  const isBooked = (entry: CalendarEntry) =>
    bookings.some((b) => triple(b) === triple(entry) && b.status === 'confirmed');

  const isOnWaitlist = (entry: CalendarEntry) =>
    waitlist.some((w) => triple(w) === triple(entry) && ['waiting', 'offered'].includes(w.status));

  const handleBook = async (entry: CalendarEntry) => {
    setPendingAction(triple(entry));
    setError(null);
    try {
      await apiClient(apiUrl(`/api/activities/${entry.activityTypeId}/book`), {
        method: 'POST',
        body: JSON.stringify({ date: entry.date, shift: entry.shift }),
      });
      showSuccess(t('reservaConfirmada'));
      await fetchAll();
    } catch (err: any) { setError(err.message); }
    finally { setPendingAction(null); }
  };

  const handleJoinWaitlist = async (entry: CalendarEntry) => {
    setPendingAction(triple(entry));
    setError(null);
    try {
      await apiClient(apiUrl(`/api/activities/${entry.activityTypeId}/waitlist`), {
        method: 'POST',
        body: JSON.stringify({ date: entry.date, shift: entry.shift }),
      });
      showSuccess(t('waitlistJoined'));
      await fetchAll();
    } catch (err: any) { setError(err.message); }
    finally { setPendingAction(null); }
  };

  const handleCancel = async (booking: MyBooking) => {
    setCancelTarget(null);
    setPendingAction(booking.id);
    setError(null);
    try {
      await apiClient(apiUrl(`/api/activities/bookings/${booking.id}/cancel`), { method: 'POST' });
      showSuccess(t('reservaCancelada'));
      await fetchAll();
    } catch (err: any) { setError(err.message); }
    finally { setPendingAction(null); }
  };

  const handleOffer = async (entry: MyWaitlistEntry, action: 'accept' | 'decline') => {
    setPendingAction(entry.id);
    setError(null);
    try {
      await apiClient(apiUrl(`/api/activities/offers/${entry.id}/${action}`), { method: 'POST' });
      showSuccess(action === 'accept' ? t('reservaConfirmada') : t('ofertaRechazada'));
      await fetchAll();
    } catch (err: any) { setError(err.message); }
    finally { setPendingAction(null); }
  };

  const offered = waitlist.filter((w) => w.status === 'offered' && w.offer_expires_at && new Date(w.offer_expires_at) > new Date());
  const expiredOffers = waitlist.filter((w) => w.status === 'expired' || (w.status === 'offered' && w.offer_expires_at && new Date(w.offer_expires_at) <= new Date()));
  const waiting = waitlist.filter((w) => w.status === 'waiting');

  if (loading) return <div><PageHeader title={t('titulo')} subtitle={t('subtitulo')} /><LoadingSkeleton rows={3} /></div>;

  return (
    <div>
      <PageHeader title={t('titulo')} subtitle={t('subtitulo')} />
      {error && <ErrorState message={error} onRetry={fetchAll} />}
      {successMsg && (
        <div className="mb-4 rounded-md bg-primary/10 p-3 text-sm text-primary">{successMsg}</div>
      )}

      {offered.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">{t('ofertasTitulo')}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {offered.map((w) => (
              <Card key={w.id} className="border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{w.name}</CardTitle>
                    <Badge>{t('ofertaBadge')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.date).toLocaleDateString()} · {w.shift}{w.localidad ? ` · ${w.localidad}` : ''}
                  </p>
                  <p className="mt-1 text-xs font-medium text-primary">
                    {t('ofertaCaduca', { fecha: new Date(w.offer_expires_at as string).toLocaleString() })}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleOffer(w, 'accept')} disabled={pendingAction === w.id}>
                      {t('aceptarOferta')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOffer(w, 'decline')} disabled={pendingAction === w.id}>
                      {t('rechazarOferta')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {expiredOffers.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
          {t('ofertaExpiradaAviso', { count: expiredOffers.length })}
        </div>
      )}

      {bookings.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">{t('misReservas')}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.date).toLocaleDateString()} · {b.shift}{b.localidad ? ` · ${b.localidad}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelTarget(b)}
                      disabled={pendingAction === b.id}
                    >
                      {t('cancelar')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">{t('enEspera')}</h2>
          <div className="space-y-2">
            {waiting.map((w) => (
              <div key={w.id} className="rounded-md border p-3 text-sm">
                <span className="font-medium">{w.name}</span>{' '}
                <span className="text-muted-foreground">
                  · {new Date(w.date).toLocaleDateString()} · {w.shift} · {t('posicion', { position: w.position })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">{t('calendario')}</h2>
        {!error && sessions.length === 0 ? (
          <EmptyState title={t('noSesiones')} description={t('vuelveMasTarde')} />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {sessions.map((s) => {
              const booked = isBooked(s);
              const onWaitlist = isOnWaitlist(s);
              return (
                <Card key={triple(s)} className={s.isCancelled ? 'opacity-60' : undefined}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{s.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.date).toLocaleDateString()} · {s.shift}{s.localidad ? ` · ${s.localidad}` : ''}
                        </p>
                      </div>
                      <Badge variant={s.available > 0 && !s.isCancelled ? 'default' : 'outline'}>
                        {s.available}/{s.capacity} {t('plazas')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {s.isCancelled ? (
                      <Badge variant="outline">{t('cancelada')}</Badge>
                    ) : booked ? (
                      <Badge>{t('yaReservada')}</Badge>
                    ) : onWaitlist ? (
                      <Badge variant="outline">{t('enListaEspera')}</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {s.available > 0 ? (
                          <Button size="sm" onClick={() => handleBook(s)} disabled={pendingAction === triple(s)}>
                            {pendingAction === triple(s) ? t('reservando') : t('reservar')}
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleJoinWaitlist(s)} disabled={pendingAction === triple(s)}>
                            {pendingAction === triple(s) ? t('uniendose') : t('unirseLista')}
                          </Button>
                        )}
                      </div>
                    )}
                    {s.waitlistCount > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">{t('personasEnLista', { count: s.waitlistCount })}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCancelTarget(null)}>
          <div className="mx-4 max-w-md rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-base font-semibold">{t('cancelarTitulo')}</h3>
            <p className="mb-1 text-sm text-muted-foreground">
              {cancelTarget.name} · {new Date(cancelTarget.date).toLocaleDateString()} · {cancelTarget.shift}
            </p>
            <p className="mb-4 text-sm text-destructive">{t('cancelarAviso24h')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelTarget(null)}>{t('cancelarNo')}</Button>
              <Button variant="destructive" onClick={() => handleCancel(cancelTarget)}>{t('cancelarSi')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
