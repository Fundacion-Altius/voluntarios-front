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

type Translator = ReturnType<typeof useTranslations>;
type Volunteer = ReturnType<typeof useAttendance>['volunteers'][number];
type AttendanceRowData = ReturnType<typeof useAttendance>['attendance'][number];

const entryKey = (e: CalendarEntry) => `${e.activityTypeId}-${e.date}-${e.shift}`;

function EntryBadges({ e, t }: { e: CalendarEntry; t: Translator }) {
  if (e.isCancelled) return <Badge variant="outline">{t('cancelada')}</Badge>;
  if (e.available <= 0) return <Badge variant="outline">{t('completa')}</Badge>;
  return null;
}

function EntryList({ entries, selected, isLoading, onSelect, t }: {
  entries: CalendarEntry[]; selected: CalendarEntry | null; isLoading: boolean;
  onSelect: (e: CalendarEntry) => void; t: Translator;
}) {
  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-8 w-full" />))}</div>;
  }
  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t('noEntradas')}</p>;
  }
  const selectedKey = selected ? entryKey(selected) : null;
  return (
    <div className="max-h-96 space-y-2 overflow-y-auto">
      {entries.map((e) => (
        <button
          key={entryKey(e)}
          onClick={() => onSelect(e)}
          className={`w-full rounded-md border p-2 text-left text-sm hover:bg-muted ${selectedKey === entryKey(e) ? 'border-primary bg-primary/5' : ''}`}
        >
          <span className="font-medium">{e.name}</span>{' '}
          <span className="text-xs text-muted-foreground">
            · {fmtDate(e.date)} · {e.shift}
          </span>{' '}
          <EntryBadges e={e} t={t} />
        </button>
      ))}
    </div>
  );
}

function statusLabel(status: string, t: Translator): string {
  const labels: Record<string, string> = {
    confirmed: t('confirmada'),
    cancelled: t('cancelada'),
    expired: t('expirada'),
  };
  return labels[status] ?? status;
}

function fmtTime(iso?: string | null) {
  return iso ? new Date(iso).toLocaleTimeString() : '—';
}

function CheckAction({ row, submitting, onAction, t }: {
  row: AttendanceRowData; submitting: boolean;
  onAction: (kind: 'in' | 'out', rowId: string) => void; t: Translator;
}) {
  if (row.status !== 'confirmed') return null;
  const checkedIn = Boolean(row.checkIn?.check_in_at);
  const checkedOut = Boolean(row.checkIn?.check_out_at);
  if (checkedIn && checkedOut) return null;
  const kind = checkedIn ? 'out' : 'in';
  return (
    <Button size="sm" variant="outline" disabled={submitting} onClick={() => onAction(kind, row.id)}>
      {kind === 'in' ? t('hacerCheckIn') : t('hacerCheckOut')}
    </Button>
  );
}

function AttendanceTable({ attendance, volunteers, submitting, onAction, t }: {
  attendance: AttendanceRowData[]; volunteers: Volunteer[]; submitting: boolean;
  onAction: (kind: 'in' | 'out', rowId: string) => void; t: Translator;
}) {
  if (attendance.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t('sinReservas')}</p>;
  }
  return (
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
          return (
            <tr key={row.id} className="border-t">
              <td className="py-2">{name}</td>
              <td className="py-2">
                <Badge variant={row.status === 'confirmed' ? 'default' : 'secondary'}>
                  {statusLabel(row.status, t)}
                </Badge>
              </td>
              <td className="py-2 text-xs text-muted-foreground">{fmtTime(row.checkIn?.check_in_at)}</td>
              <td className="py-2 text-xs text-muted-foreground">{fmtTime(row.checkIn?.check_out_at)}</td>
              <td className="py-2">
                <CheckAction row={row} submitting={submitting} onAction={onAction} t={t} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function WalkInForm({ candidates, volunteerId, setVolunteerId, submitting, onSubmit, t }: {
  candidates: Volunteer[]; volunteerId: string; setVolunteerId: (v: string) => void;
  submitting: boolean; onSubmit: () => void; t: Translator;
}) {
  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4"
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <div className="min-w-48 flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('anadirSinReserva')}</label>
        <Select value={volunteerId} onValueChange={setVolunteerId}>
          <SelectTrigger><SelectValue placeholder={t('eligeVoluntario')} /></SelectTrigger>
          <SelectContent>
            {candidates.map((v) => (
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
  );
}

function AsistenciaDetail({ selected, isLoadingAttendance, attendance, volunteers, submitting, onAction, walkIn, t }: {
  selected: CalendarEntry | null; isLoadingAttendance: boolean;
  attendance: AttendanceRowData[]; volunteers: Volunteer[]; submitting: boolean;
  onAction: (kind: 'in' | 'out', rowId: string) => void;
  walkIn: { candidates: Volunteer[]; volunteerId: string; setVolunteerId: (v: string) => void; onSubmit: () => void; error: string };
  t: Translator;
}) {
  if (!selected) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t('seleccionaPrimero')}</p>;
  }
  if (isLoadingAttendance) {
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>;
  }
  return (
    <>
      <AttendanceTable attendance={attendance} volunteers={volunteers} submitting={submitting} onAction={onAction} t={t} />
      <WalkInForm
        candidates={walkIn.candidates} volunteerId={walkIn.volunteerId} setVolunteerId={walkIn.setVolunteerId}
        submitting={submitting} onSubmit={walkIn.onSubmit} t={t}
      />
      {walkIn.error && <p className="mt-2 text-sm text-destructive">{walkIn.error}</p>}
      <p className="mt-2 text-xs text-muted-foreground">{t('sinReservaDesc')}</p>
    </>
  );
}

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

  const handleCheckAction = async (kind: 'in' | 'out', rowId: string) => {
    if (!selected) return;
    setSubmitting(true); setWalkInError('');
    try {
      const fn = kind === 'in' ? checkIn : checkOut;
      await fn(rowId, selected.activityTypeId, selected.date, selected.shift);
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
            <EntryList entries={entries} selected={selected} isLoading={isLoadingEntries} onSelect={selectEntry} t={t} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {selected ? `${selected.name} — ${fmtDate(selected.date)} — ${selected.shift}` : t('asistenciaTitulo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AsistenciaDetail
              selected={selected}
              isLoadingAttendance={isLoadingAttendance}
              attendance={attendance}
              volunteers={volunteers}
              submitting={submitting}
              onAction={handleCheckAction}
              walkIn={{ candidates: walkInCandidates, volunteerId, setVolunteerId, onSubmit: handleWalkIn, error: walkInError }}
              t={t}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
