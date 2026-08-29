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
import { MessagingNav } from '../MessagingNav';

interface Template {
  id: string;
  name: string;
  channel: string;
  content: string;
}

export default function MessagingTemplatesPage() {
  const t = useTranslations('admin.messaging');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('both');
  const [content, setContent] = useState('Hola {{name}}');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const result = await apiClient<{ data: Template[] }>(apiUrl('/api/messaging/templates'));
    if (result.success) setTemplates(result.data.data ?? []);
    else setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    refresh();
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return null;

  const create = async () => {
    const result = await apiClient(apiUrl('/api/messaging/templates'), {
      method: 'POST',
      body: JSON.stringify({ name, channel, content, variables: ['name'] }),
    });
    if (!result.success) setError(result.error);
    else refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <MessagingNav />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('templates')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>{t('templateName')}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Label>{t('channel')}</Label>
          <select className="border-input h-9 rounded-md border px-3" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="both">both</option>
            <option value="whatsapp">whatsapp</option>
            <option value="telegram">telegram</option>
          </select>
          <Label>{t('content')}</Label>
          <Input value={content} onChange={(e) => setContent(e.target.value)} />
          <Button onClick={create}>{t('save')}</Button>
          <ul className="space-y-2 text-sm">
            {templates.map((tpl) => (
              <li key={tpl.id}>
                {tpl.name} ({tpl.channel}): {tpl.content}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
