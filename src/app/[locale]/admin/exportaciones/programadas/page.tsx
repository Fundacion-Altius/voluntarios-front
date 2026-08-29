'use client';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/app/lib/csrf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Schedule {
  id: string;
  name: string;
  cadence: string;
  email: string;
  paused: boolean;
}

export default function ScheduledExportsPage() {
  const t = useTranslations('admin.export');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [name, setName] = useState('Weekly volunteer activity');
  const [email, setEmail] = useState('');
  const [cadence, setCadence] = useState('weekly');
  const [error, setError] = useState('');

  const reload = () => {
    apiGet('/api/export/schedules')
      .then((res) => res.json())
      .then(setSchedules);
  };

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    setError('');
    const response = await apiPost('/api/export/schedules', {
      name,
      cadence,
      email,
      request: { templateId: 'volunteer-activity-report', format: 'xlsx' },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || t('error'));
      return;
    }
    reload();
  };

  const pauseOrResume = async (item: Schedule) => {
    await apiPatch(item.paused ? `/api/export/schedules/${item.id}/resume` : `/api/export/schedules/${item.id}/pause`);
    reload();
  };

  const remove = async (id: string) => {
    await apiDelete(`/api/export/schedules/${id}`);
    reload();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('schedulesTitle')}</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('newSchedule')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cadence">{t('cadence')}</Label>
            <select id="cadence" className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={cadence} onChange={(event) => setCadence(event.target.value)}>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
          </div>
          <Button onClick={create}>{t('createSchedule')}</Button>
        </CardContent>
      </Card>
      {schedules.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="text-base">{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{item.cadence} · {item.email} · {item.paused ? t('paused') : t('active')}</span>
            <Button variant="outline" onClick={() => pauseOrResume(item)}>{item.paused ? t('resume') : t('pause')}</Button>
            <Button variant="destructive" onClick={() => remove(item.id)}>{t('delete')}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
