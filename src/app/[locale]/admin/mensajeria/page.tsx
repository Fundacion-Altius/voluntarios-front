'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';
import { MessagingNav } from './MessagingNav';

interface ChannelConfig {
  id: string;
  channel_type: string;
  config_json: Record<string, unknown>;
}

export default function MessagingConfigPage() {
  const t = useTranslations('admin.messaging');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [channel, setChannel] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [json, setJson] = useState('{}');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    apiClient<{ data: ChannelConfig[] }>(apiUrl('/api/messaging/config')).then((result) => {
      if (result.success) {
        const current = result.data.data?.find((c) => c.channel_type === channel);
        if (current) setJson(JSON.stringify(current.config_json, null, 2));
      } else setError(result.error);
      setLoading(false);
    });
  }, [authLoading, isAuthenticated, channel]);

  if (authLoading || loading) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return null;

  const save = async () => {
    setError('');
    let config_json: Record<string, unknown> = {};
    try {
      config_json = JSON.parse(json);
    } catch {
      setError(t('invalidJson'));
      return;
    }
    const result = await apiClient(apiUrl('/api/messaging/config'), {
      method: 'PUT',
      body: JSON.stringify({ channel_type: channel, config_json }),
    });
    if (!result.success) setError(result.error);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <MessagingNav />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('config')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>{t('channel')}</Label>
          <select className="border-input h-9 rounded-md border px-3" value={channel} onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'telegram')}>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
          <Label>{t('configJson')}</Label>
          <Input value={json} onChange={(e) => setJson(e.target.value)} />
          <Button onClick={save}>{t('save')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
