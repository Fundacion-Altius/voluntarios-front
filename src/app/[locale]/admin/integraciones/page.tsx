'use client';

import { apiDelete, apiGet, apiPost, apiPut } from '@/app/lib/csrf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

type Provider = 'notion' | 'airtable';

interface Connection {
  provider: Provider;
  status: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface Mapping {
  external_target_id: string;
  external_table_id?: string | null;
}

interface Run {
  id: string;
  provider: string;
  action: string;
  status: string;
  counts: Record<string, number>;
  created_at: string;
}

export default function IntegracionesPage() {
  const t = useTranslations('admin.integraciones');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [notionDb, setNotionDb] = useState('');
  const [airtableBase, setAirtableBase] = useState('');
  const [airtableTable, setAirtableTable] = useState('');
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [connRes, runsRes] = await Promise.all([
        apiGet('/api/integrations/connections'),
        apiGet('/api/integrations/runs'),
      ]);
      if (connRes.ok) setConnections(await connRes.json());
      if (runsRes.ok) setRuns(await runsRes.json());

      const notionMap = await apiGet('/api/integrations/notion/mapping');
      if (notionMap.ok) {
        const m = (await notionMap.json()) as Mapping | null;
        if (m?.external_target_id) setNotionDb(m.external_target_id);
      }
      const airMap = await apiGet('/api/integrations/airtable/mapping');
      if (airMap.ok) {
        const m = (await airMap.json()) as Mapping | null;
        if (m?.external_target_id) setAirtableBase(m.external_target_id);
        if (m?.external_table_id) setAirtableTable(m.external_table_id);
      }
    } catch {
      setError(t('error'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusOf = (p: Provider) => connections.find((c) => c.provider === p)?.status || 'disconnected';

  const connect = async (provider: Provider) => {
    setBusy(true);
    setError('');
    try {
      const res = await apiPost(`/api/integrations/oauth/${provider}/start`, {});
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || t('error'));
        return;
      }
      window.location.href = body.authorizationUrl;
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async (provider: Provider) => {
    setBusy(true);
    setError('');
    try {
      const res = await apiDelete(`/api/integrations/connections/${provider}`);
      if (!res.ok && res.status !== 204) {
        setError(t('error'));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const saveNotionMapping = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiPut('/api/integrations/notion/mapping', { database_id: notionDb });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t('error'));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const saveAirtableMapping = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiPut('/api/integrations/airtable/mapping', {
        base_id: airtableBase,
        table_id: airtableTable,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t('error'));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (path: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await apiPost(path, {});
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t('error'));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {t('status')}: <strong>{statusOf('notion')}</strong>
            </p>
            {statusOf('notion') === 'connected' ? (
              <Button variant="outline" disabled={busy} onClick={() => void disconnect('notion')}>
                {t('disconnect')}
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => void connect('notion')}>
                {t('connect')}
              </Button>
            )}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">{t('notionDatabase')}</label>
              <Input value={notionDb} onChange={(e) => setNotionDb(e.target.value)} placeholder="database_id" />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={busy} onClick={() => void saveNotionMapping()}>
                  {t('saveMapping')}
                </Button>
                <Button disabled={busy} onClick={() => void runAction('/api/integrations/notion/sync')}>
                  {t('runSync')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Airtable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {t('status')}: <strong>{statusOf('airtable')}</strong>
            </p>
            {statusOf('airtable') === 'connected' ? (
              <Button variant="outline" disabled={busy} onClick={() => void disconnect('airtable')}>
                {t('disconnect')}
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => void connect('airtable')}>
                {t('connect')}
              </Button>
            )}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">{t('airtableBase')}</label>
              <Input value={airtableBase} onChange={(e) => setAirtableBase(e.target.value)} placeholder="base_id" />
              <label className="text-sm font-medium">{t('airtableTable')}</label>
              <Input value={airtableTable} onChange={(e) => setAirtableTable(e.target.value)} placeholder="table_id" />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={busy} onClick={() => void saveAirtableMapping()}>
                  {t('saveMapping')}
                </Button>
                <Button disabled={busy} onClick={() => void runAction('/api/integrations/airtable/import')}>
                  {t('runImport')}
                </Button>
                <Button disabled={busy} onClick={() => void runAction('/api/integrations/airtable/export')}>
                  {t('runExport')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('runsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noRuns')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {runs.map((r) => (
                <li key={r.id} className="flex flex-wrap gap-2 border-b pb-2">
                  <span className="font-medium">
                    {r.provider}/{r.action}
                  </span>
                  <span>{r.status}</span>
                  <span className="text-muted-foreground">{JSON.stringify(r.counts)}</span>
                  <span className="text-muted-foreground">{r.created_at}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
