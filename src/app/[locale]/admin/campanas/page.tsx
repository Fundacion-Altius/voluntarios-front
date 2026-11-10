'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
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
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

type Channel = 'email' | 'in_app';

interface Campaign {
  id: string;
  title: string;
  body: string;
  audience: string;
  channels: Channel[];
  status: string;
  delivered: number;
  engagement: { opens: number; clicks: number; shares: number };
}

export default function CampanasPage() {
  const t = useTranslations('admin.campanas');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totals, setTotals] = useState({ opens: 0, clicks: 0, shares: 0, delivered: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('members');
  const [emailOn, setEmailOn] = useState(true);
  const [inAppOn, setInAppOn] = useState(true);

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/campaigns/seed-demo', {});
      const res = await apiGet('/api/campaigns');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as {
        campaigns?: Campaign[];
        totals?: { opens: number; clicks: number; shares: number; delivered: number };
      };
      setCampaigns(data.campaigns || []);
      setTotals(data.totals || { opens: 0, clicks: 0, shares: 0, delivered: 0 });
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

  const createCampaign = async () => {
    if (!title.trim() || !body.trim()) return;
    const channels: Channel[] = [];
    if (emailOn) channels.push('email');
    if (inAppOn) channels.push('in_app');
    if (!channels.length) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/campaigns', {
        title: title.trim(),
        body: body.trim(),
        audience: audience.trim() || 'members',
        channels,
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setTitle('');
      setBody('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const send = async (id: string) => {
    setBusy(true);
    try {
      await apiPost(`/api/campaigns/${id}/send`, {});
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const refresh = async (id: string) => {
    setBusy(true);
    try {
      await apiPost(`/api/campaigns/${id}/refresh-engagement`, {});
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
      <div>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('metricsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <span>
            {t('delivered')}: <strong>{totals.delivered}</strong>
          </span>
          <span>
            {t('opens')}: <strong>{totals.opens}</strong>
          </span>
          <span>
            {t('clicks')}: <strong>{totals.clicks}</strong>
          </span>
          <span>
            {t('shares')}: <strong>{totals.shares}</strong>
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder={t('titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder={t('bodyPlaceholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <Input
            placeholder={t('audiencePlaceholder')}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={emailOn} onChange={(e) => setEmailOn(e.target.checked)} />
              {t('channel.email')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={inAppOn} onChange={(e) => setInAppOn(e.target.checked)} />
              {t('channel.in_app')}
            </label>
          </div>
          <Button type="button" onClick={() => void createCampaign()} disabled={busy}>
            {t('create')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns.length ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colTitle')}</TableHead>
                  <TableHead>{t('colChannels')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead>{t('colEngagement')}</TableHead>
                  <TableHead>{t('colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>{c.channels.join(', ')}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>
                      {c.status === 'sent'
                        ? `${c.engagement.opens}/${c.engagement.clicks}/${c.engagement.shares}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {c.status !== 'sent' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void send(c.id)}
                        >
                          {t('send')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void refresh(c.id)}
                        >
                          {t('refreshEngagement')}
                        </Button>
                      )}
                    </TableCell>
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
