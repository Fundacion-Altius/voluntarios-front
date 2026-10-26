'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
import { Badge } from '@/components/ui/badge';
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

interface Template {
  id: string;
  name: string;
  capacity: number;
  weekdays: number[];
}

interface Shift {
  id: string;
  date: string;
  name: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
  status: string;
}

interface Blackout {
  id: string;
  date: string;
  reason: string;
}

export default function CitasPage() {
  const t = useTranslations('admin.citas');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [beneficiary, setBeneficiary] = useState('');

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/schedule/seed-demo', {});
      const res = await apiGet('/api/schedule');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as {
        templates?: Template[];
        shifts?: Shift[];
        blackouts?: Blackout[];
      };
      setTemplates(data.templates || []);
      setShifts(data.shifts || []);
      setBlackouts(data.blackouts || []);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial seed+load only
  }, []);

  const book = async (shiftId: string) => {
    if (!beneficiary.trim()) return;
    const res = await apiPost(`/api/schedule/shifts/${shiftId}/book`, {
      beneficiary_name: beneficiary.trim(),
    });
    if (!res.ok) {
      setError(t('error'));
      return;
    }
    setBeneficiary('');
    await load();
  };

  const closeShift = async (shiftId: string) => {
    const res = await apiPost(`/api/schedule/shifts/${shiftId}/close`, {
      reason: t('defaultCloseReason'),
    });
    if (!res.ok) {
      setError(t('error'));
      return;
    }
    await load();
  };

  if (loading) return <p className="p-6 text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('templatesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{tpl.name}</div>
              <div className="text-muted-foreground">
                {t('capacity')}: {tpl.capacity} · {t('weekdays')}: {tpl.weekdays.join(', ')}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('shiftsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder={t('beneficiaryPlaceholder')}
            className="max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colDate')}</TableHead>
                <TableHead>{t('colShift')}</TableHead>
                <TableHead>{t('colBooked')}</TableHead>
                <TableHead>{t('colStatus')}</TableHead>
                <TableHead>{t('colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.date}</TableCell>
                  <TableCell>
                    {s.name} ({s.start}–{s.end})
                  </TableCell>
                  <TableCell>
                    {s.booked}/{s.capacity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'open' ? 'default' : 'secondary'}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    {s.status === 'open' ? (
                      <>
                        <Button size="sm" variant="outline" type="button" onClick={() => void book(s.id)}>
                          {t('book')}
                        </Button>
                        <Button size="sm" variant="destructive" type="button" onClick={() => void closeShift(s.id)}>
                          {t('close')}
                        </Button>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('blackoutsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {blackouts.map((b) => (
              <li key={b.id}>
                {b.date} — {b.reason}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
