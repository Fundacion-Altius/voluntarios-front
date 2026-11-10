'use client';

import { apiGet, apiPatch, apiPost } from '@/app/lib/csrf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface BurnoutAlert {
  id: string;
  volunteer_name: string;
  kind: string;
  detail: string;
}

interface AbsencePattern {
  volunteer_id: string;
  volunteer_name: string;
  count: number;
  recent_dates: string[];
}

interface ConflictCase {
  id: string;
  subject: string;
  description: string;
  status: string;
}

interface WellbeingCheckIn {
  id: string;
  volunteer_name: string;
  mood: number;
  note: string | null;
  created_at: string;
}

interface WellbeingDashboard {
  alerts: BurnoutAlert[];
  absences: AbsencePattern[];
  conflicts: ConflictCase[];
  check_ins: WellbeingCheckIn[];
}

export default function BienestarPage() {
  const t = useTranslations('admin.bienestar');
  const [data, setData] = useState<WellbeingDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiGet('/api/wellbeing/dashboard');
      if (!res.ok) {
        setError(t('error'));
        setData(null);
        return;
      }
      setData((await res.json()) as WellbeingDashboard);
    } catch {
      setError(t('error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const runDetect = async () => {
    setBusy(true);
    try {
      await apiPost('/api/wellbeing/seed-demo', {});
      await apiPost('/api/wellbeing/detect', {});
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const createConflict = async () => {
    if (!subject.trim() || !description.trim()) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/wellbeing/conflicts', {
        subject: subject.trim(),
        description: description.trim(),
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setSubject('');
      setDescription('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const setConflictStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      await apiPatch(`/api/wellbeing/conflicts/${id}`, { status });
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button" onClick={() => void runDetect()} disabled={busy}>
          {t('runDetect')}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('alertsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.alerts.length ? (
            <p className="text-sm text-muted-foreground">{t('alertsEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colVolunteer')}</TableHead>
                  <TableHead>{t('colKind')}</TableHead>
                  <TableHead>{t('colDetail')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.volunteer_name}</TableCell>
                    <TableCell>{a.kind}</TableCell>
                    <TableCell>{a.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('absencesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.absences.length ? (
            <p className="text-sm text-muted-foreground">{t('absencesEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colVolunteer')}</TableHead>
                  <TableHead>{t('colCount')}</TableHead>
                  <TableHead>{t('colRecent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.absences.map((a) => (
                  <TableRow key={a.volunteer_id}>
                    <TableCell>{a.volunteer_name}</TableCell>
                    <TableCell>{a.count}</TableCell>
                    <TableCell>{a.recent_dates.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('conflictsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder={t('conflictSubject')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Input
              placeholder={t('conflictDescription')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="button" onClick={() => void createConflict()} disabled={busy}>
              {t('conflictCreate')}
            </Button>
          </div>
          {!data?.conflicts.length ? (
            <p className="text-sm text-muted-foreground">{t('conflictsEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colSubject')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead>{t('colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conflicts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.subject}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell className="space-x-2">
                      {c.status === 'open' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void setConflictStatus(c.id, 'escalated')}
                          disabled={busy}
                        >
                          {t('escalate')}
                        </Button>
                      ) : null}
                      {c.status !== 'resolved' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void setConflictStatus(c.id, 'resolved')}
                          disabled={busy}
                        >
                          {t('resolve')}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('checkInsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.check_ins.length ? (
            <p className="text-sm text-muted-foreground">{t('checkInsEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colVolunteer')}</TableHead>
                  <TableHead>{t('colMood')}</TableHead>
                  <TableHead>{t('colNote')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.check_ins.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.volunteer_name}</TableCell>
                    <TableCell>{c.mood}</TableCell>
                    <TableCell>{c.note || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
