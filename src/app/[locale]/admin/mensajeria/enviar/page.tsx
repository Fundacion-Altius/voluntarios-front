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
}

export default function MessagingComposerPage() {
  const t = useTranslations('admin.messaging');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [to, setTo] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'telegram'>('telegram');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    apiClient<{ data: Template[] }>(apiUrl('/api/messaging/templates')).then((result) => {
      if (result.success) {
        setTemplates(result.data.data ?? []);
        if (result.data.data?.[0]) setTemplateId(result.data.data[0].id);
      }
      setLoading(false);
    });
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return null;

  const send = async () => {
    const result = await apiClient<{ sent: number; queued: number; failed: number }>(apiUrl('/api/messaging/send'), {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        recipients: [{ channel, to, variables: { name: 'Voluntario' }, emailFallback: email || undefined }],
      }),
    });
    if (result.success) setStatus(JSON.stringify(result.data));
    else setStatus(result.error);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <MessagingNav />
      <Card>
        <CardHeader>
          <CardTitle>{t('composer')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>{t('templates')}</Label>
          <select className="border-input h-9 rounded-md border px-3" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          <Label>{t('channel')}</Label>
          <select className="border-input h-9 rounded-md border px-3" value={channel} onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'telegram')}>
            <option value="whatsapp">whatsapp</option>
            <option value="telegram">telegram</option>
          </select>
          <Label>{t('recipient')}</Label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} />
          <Label>{t('emailFallback')}</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={send}>{t('send')}</Button>
          {status ? <p className="text-sm">{status}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
