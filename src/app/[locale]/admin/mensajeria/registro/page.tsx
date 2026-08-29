'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';
import { MessagingNav } from '../MessagingNav';

interface LogRow {
  id: string;
  channel_type: string;
  direction: string;
  content: string;
  status: string;
  created_at: string;
}

export default function MessagingLogsPage() {
  const t = useTranslations('admin.messaging');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [channel, setChannel] = useState('');
  const [direction, setDirection] = useState('');
  const [from, setFrom] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    if (direction) params.set('direction', direction);
    if (from) params.set('from', from);
    const result = await apiClient<{ data: LogRow[] }>(apiUrl(`/api/messaging/logs?${params.toString()}`));
    if (result.success) setRows(result.data.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    load();
  }, [authLoading, isAuthenticated, channel, direction, from]);

  if (authLoading || loading) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <MessagingNav />
      <Card>
        <CardHeader>
          <CardTitle>{t('logs')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label>{t('channel')}</Label>
              <select className="border-input h-9 rounded-md border px-3" value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="">{t('all')}</option>
                <option value="whatsapp">whatsapp</option>
                <option value="telegram">telegram</option>
              </select>
            </div>
            <div>
              <Label>{t('direction')}</Label>
              <select className="border-input h-9 rounded-md border px-3" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="">{t('all')}</option>
                <option value="inbound">inbound</option>
                <option value="outbound">outbound</option>
              </select>
            </div>
            <div>
              <Label>{t('fromDate')}</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.id}>
                {row.created_at} · {row.channel_type} · {row.direction} · {row.status} · {row.content}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
