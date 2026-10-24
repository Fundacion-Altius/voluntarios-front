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

type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook';

interface SocialPost {
  id: string;
  platform: Platform;
  body: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  engagement: { likes: number; shares: number; comments: number };
}

const PLATFORMS: Platform[] = ['linkedin', 'twitter', 'instagram', 'facebook'];

export default function RedesSocialesPage() {
  const t = useTranslations('admin.redesSociales');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [totals, setTotals] = useState({ likes: 0, shares: 0, comments: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState('');
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [scheduledAt, setScheduledAt] = useState('');

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/social-media/seed-demo', {});
      const res = await apiGet('/api/social-media');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as {
        posts?: SocialPost[];
        totals?: { likes: number; shares: number; comments: number };
      };
      setPosts(data.posts || []);
      setTotals(data.totals || { likes: 0, shares: 0, comments: 0 });
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

  const createPost = async (publishNow: boolean) => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/social-media', {
        platform,
        body: body.trim(),
        publish_now: publishNow,
        scheduled_at: !publishNow && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setBody('');
      setScheduledAt('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const publish = async (id: string) => {
    setBusy(true);
    try {
      await apiPost(`/api/social-media/${id}/publish`, {});
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
      await apiPost(`/api/social-media/${id}/refresh-engagement`, {});
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
            {t('likes')}: <strong>{totals.likes}</strong>
          </span>
          <span>
            {t('shares')}: <strong>{totals.shares}</strong>
          </span>
          <span>
            {t('comments')}: <strong>{totals.comments}</strong>
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm sm:w-48"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {t(`platform.${p}`)}
              </option>
            ))}
          </select>
          <Textarea
            placeholder={t('bodyPlaceholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            aria-label={t('scheduleLabel')}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void createPost(true)} disabled={busy}>
              {t('publishNow')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void createPost(false)}
              disabled={busy || !scheduledAt}
            >
              {t('schedule')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!posts.length ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colPlatform')}</TableHead>
                  <TableHead>{t('colBody')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead>{t('colEngagement')}</TableHead>
                  <TableHead>{t('colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{t(`platform.${p.platform}`)}</TableCell>
                    <TableCell className="max-w-xs truncate">{p.body}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell>
                      {p.status === 'published'
                        ? `${p.engagement.likes}/${p.engagement.shares}/${p.engagement.comments}`
                        : '—'}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {p.status !== 'published' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void publish(p.id)}
                        >
                          {t('publish')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void refresh(p.id)}
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
