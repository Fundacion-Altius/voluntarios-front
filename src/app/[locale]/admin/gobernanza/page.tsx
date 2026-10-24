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
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface Vote {
  id: string;
  title: string;
  status: string;
  tally: { yes: number; no: number; abstain: number };
}

interface Minutes {
  id: string;
  title: string;
  status: string;
  meeting_date: string;
}

interface TransparencyItem {
  kind: string;
  id: string;
  title: string;
  summary: string;
}

export default function GobernanzaPage() {
  const t = useTranslations('admin.gobernanza');
  const [votes, setVotes] = useState<Vote[]>([]);
  const [minutes, setMinutes] = useState<Minutes[]>([]);
  const [transparency, setTransparency] = useState<TransparencyItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [voteTitle, setVoteTitle] = useState('');
  const [minutesTitle, setMinutesTitle] = useState('');
  const [minutesBody, setMinutesBody] = useState('');

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/governance/seed-demo', {});
      const res = await apiGet('/api/governance');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as {
        votes?: Vote[];
        minutes?: Minutes[];
        transparency?: TransparencyItem[];
      };
      setVotes(data.votes || []);
      setMinutes(data.minutes || []);
      setTransparency(data.transparency || []);
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

  const createVote = async () => {
    if (!voteTitle.trim()) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/governance/votes', { title: voteTitle.trim() });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setVoteTitle('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const cast = async (id: string, choice: string) => {
    setBusy(true);
    try {
      await apiPost(`/api/governance/votes/${id}/ballot`, { choice });
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const closeVote = async (id: string) => {
    setBusy(true);
    try {
      await apiPost(`/api/governance/votes/${id}/close`, {});
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const createMinutes = async () => {
    if (!minutesTitle.trim() || !minutesBody.trim()) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/governance/minutes', {
        title: minutesTitle.trim(),
        body: minutesBody.trim(),
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setMinutesTitle('');
      setMinutesBody('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const setMinutesStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      await apiPatch(`/api/governance/minutes/${id}`, { status });
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
          <CardTitle className="text-base">{t('transparencyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!transparency.length ? (
            <p className="text-sm text-muted-foreground">{t('transparencyEmpty')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transparency.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <span className="font-medium">{t(`kind.${item.kind}`)}</span>: {item.title} —{' '}
                  {item.summary}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('votesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder={t('voteTitlePlaceholder')}
              value={voteTitle}
              onChange={(e) => setVoteTitle(e.target.value)}
            />
            <Button type="button" onClick={() => void createVote()} disabled={busy}>
              {t('createVote')}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colTitle')}</TableHead>
                <TableHead>{t('colStatus')}</TableHead>
                <TableHead>{t('colTally')}</TableHead>
                <TableHead>{t('colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votes.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.title}</TableCell>
                  <TableCell>{v.status}</TableCell>
                  <TableCell>
                    {v.tally.yes}/{v.tally.no}/{v.tally.abstain}
                  </TableCell>
                  <TableCell className="space-x-1">
                    {v.status === 'open' ? (
                      <>
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void cast(v.id, 'yes')}>
                          {t('yes')}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void cast(v.id, 'no')}>
                          {t('no')}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void cast(v.id, 'abstain')}>
                          {t('abstain')}
                        </Button>
                        <Button type="button" size="sm" disabled={busy} onClick={() => void closeVote(v.id)}>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('minutesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={t('minutesTitlePlaceholder')}
            value={minutesTitle}
            onChange={(e) => setMinutesTitle(e.target.value)}
          />
          <Textarea
            placeholder={t('minutesBodyPlaceholder')}
            value={minutesBody}
            onChange={(e) => setMinutesBody(e.target.value)}
            rows={3}
          />
          <Button type="button" onClick={() => void createMinutes()} disabled={busy}>
            {t('createMinutes')}
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colTitle')}</TableHead>
                <TableHead>{t('colDate')}</TableHead>
                <TableHead>{t('colStatus')}</TableHead>
                <TableHead>{t('colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {minutes.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>{m.meeting_date}</TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell className="space-x-1">
                    {m.status === 'draft' ? (
                      <Button type="button" size="sm" disabled={busy} onClick={() => void setMinutesStatus(m.id, 'approved')}>
                        {t('approve')}
                      </Button>
                    ) : null}
                    {m.status === 'approved' ? (
                      <Button type="button" size="sm" disabled={busy} onClick={() => void setMinutesStatus(m.id, 'published')}>
                        {t('publish')}
                      </Button>
                    ) : null}
                    {m.status === 'published' ? '—' : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
