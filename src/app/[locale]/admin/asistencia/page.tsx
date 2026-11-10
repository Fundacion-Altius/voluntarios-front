'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAttendance, type CalendarEntry } from './useAttendance';

function fmtDate(d: string) { return new Date(d).toLocaleDateString(); }

export default function AsistenciaPage() {
  const t = useTranslations('admin.asistencia');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    entries, attendance, volunteers, isLoadingEntries, isLoadingAttendance, error,
    fetchAttendance, addWalkIn,
    checkIn, checkOut,
  } = useAttendance();

  const [selected, setSelected] = useState<CalendarEntry | null>(null);
  const [volunteerId, setVolunteerId] = useState('');
  const [walkInError, setWalkInError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectEntry = (e: CalendarEntry) => {
    setSelected(e);
    fetchAttendance(e.activityTypeId, e.date, e.shift);
  };

  const handleWalkIn = async () => {
    if (!selected || !volunteerId) return;
    setWalkInError(''); setSubmitting(true);
    try {
      const result = await addWalkIn(selected.activityTypeId, selected.date, selected.shift, volunteerId);
      if (!result.success) {
        setWalkInError(result.error);
        return;
      }
      setVolunteerId('');
    } catch (err: any) { setWalkInError(err.message); }
    finally { setSubmitting(false); }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" />
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const bookedUserIds = new Set(attendance.map((a) => a.user_id));
  const walkInCandidates = volunteers.filter((v) => !bookedUserIds.has(v.user_id));

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t('titulo')}</h2>
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('seleccionarEntrada')}</CardTitle></CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-8 w-full" />))}</div>
            ) : entries.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('noEntradas')}</p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {entries.map((e) => {
                  const key = `${e.activityTypeId}-${e.date}-${e.shift}`;
                  const isSelected = selected && `${selected.activityTypeId}-${selected.date}-${selected.shift}` === key;
                  return (
                    <button
                      key={key}
                      onClick={() => selectEntry(e)}
                      className={`w-full rounded-md border p-2 text-left text-sm hover:bg-muted ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <span className="font-medium">{e.name}</span>{' '}
                      <span className="text-xs text-muted-foreground">
                        · {fmtDate(e.date)} · {e.shift}
                      </span>{' '}
                      {e.isCancelled && <Badge variant="outline">{t('cancelada')}</Badge>}
                      {!e.isCancelled && e.available <= 0 && <Badge variant="outline">{t('completa')}</Badge>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {selected ? `${selected.name} — ${fmtDate(selected.date)} — ${selected.shift}` : t('asistenciaTitulo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('seleccionaPrimero')}</p>
            ) : isLoadingAttendance ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
            ) : (
              <>
                {attendance.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t('sinReservas')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2">{t('voluntario')}</th>
                        <th className="py-2">{t('estado')}</th>
                        <th className="py-2">{t('checkIn')}</th>
                        <th className="py-2">{t('checkOut')}</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((row) => {
                        const name = volunteers.find((v) => v.user_id === row.user_id)?.display_name || row.user_id.slice(0, 8);
                        const checkedIn = Boolean(row.checkIn?.check_in_at);
                        const checkedOut = Boolean(row.checkIn?.check_out_at);
                        return (
                          <tr key={row.id} className="border-t">
                            <td className="py-2">{name}</td>
                            <td className="py-2">
                              <Badge variant={row.status === 'confirmed' ? 'default' : 'secondary'}>
                                {row.status === 'confirmed' ? t('confirmada')
                                  : row.status === 'cancelled' ? t('cancelada')
                                  : row.status === 'expired' ? t('expirada')
                                  : row.status}
                              </Badge>
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">
                              {row.checkIn?.check_in_at ? new Date(row.checkIn.check_in_at).toLocaleTimeString() : '—'}
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">
                              {row.checkIn?.check_out_at ? new Date(row.checkIn.check_out_at).toLocaleTimeString() : '—'}
                            </td>
                            <td className="py-2">
                              {row.status === 'confirmed' && selected && !checkedIn && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={submitting}
                                  onClick={async () => {
                                    setSubmitting(true); setWalkInError('');
                                    try {
                                      await checkIn(row.id, selected.activityTypeId, selected.date, selected.shift);
                                    } catch (err: any) { setWalkInError(err.message); }
                                    finally { setSubmitting(false); }
                                  }}
                                >
                                  {t('hacerCheckIn')}
                                </Button>
                              )}
                              {row.status === 'confirmed' && selected && checkedIn && !checkedOut && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={submitting}
                                  onClick={async () => {
                                    setSubmitting(true); setWalkInError('');
                                    try {
                                      await checkOut(row.id, selected.activityTypeId, selected.date, selected.shift);
                                    } catch (err: any) { setWalkInError(err.message); }
                                    finally { setSubmitting(false); }
                                  }}
                                >
                                  {t('hacerCheckOut')}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                <form
                  className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4"
                  onSubmit={(e) => { e.preventDefault(); handleWalkIn(); }}
                >
                  <div className="min-w-48 flex-1">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('anadirSinReserva')}</label>
                    <Select value={volunteerId} onValueChange={setVolunteerId}>
                      <SelectTrigger><SelectValue placeholder={t('eligeVoluntario')} /></SelectTrigger>
                      <SelectContent>
                        {walkInCandidates.map((v) => (
                          <SelectItem key={v.user_id} value={v.user_id}>
                            {v.display_name || v.email || v.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={!volunteerId || submitting}>
                    {submitting ? t('anadiendo') : t('anadir')}
                  </Button>
                </form>
                {walkInError && <p className="mt-2 text-sm text-destructive">{walkInError}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{t('sinReservaDesc')}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
