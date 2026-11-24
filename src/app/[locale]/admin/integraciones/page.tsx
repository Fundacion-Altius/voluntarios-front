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

async function fetchMapping(path: string): Promise<Mapping | null> {
  const res = await apiGet(path);
  if (!res.ok) return null;
  return (await res.json()) as Mapping | null;
}

function ConnectionButton({ connected, busy, onConnect, onDisconnect }: {
  connected: boolean; busy: boolean; onConnect: () => void; onDisconnect: () => void;
}) {
  const t = useTranslations('admin.integraciones');
  if (connected) {
    return (
      <Button variant="outline" disabled={busy} onClick={onDisconnect}>
        {t('disconnect')}
      </Button>
    );
  }
  return (
    <Button disabled={busy} onClick={onConnect}>
      {t('connect')}
    </Button>
  );
}

function RunsList({ runs }: { runs: Run[] }) {
  const t = useTranslations('admin.integraciones');
  if (runs.length === 0) return <p className="text-sm text-muted-foreground">{t('noRuns')}</p>;
  return (
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
  );
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

      const notionMapping = await fetchMapping('/api/integrations/notion/mapping');
      if (notionMapping?.external_target_id) setNotionDb(notionMapping.external_target_id);
      const airMapping = await fetchMapping('/api/integrations/airtable/mapping');
      if (airMapping?.external_target_id) setAirtableBase(airMapping.external_target_id);
      if (airMapping?.external_table_id) setAirtableTable(airMapping.external_table_id);
    } catch {
      setError(t('error'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusOf = (p: Provider) => connections.find((c) => c.provider === p)?.status || 'disconnected';

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const connect = (provider: Provider) =>
    withBusy(async () => {
      const res = await apiPost(`/api/integrations/oauth/${provider}/start`, {});
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || t('error'));
        return;
      }
      window.location.href = body.authorizationUrl;
    });

  const disconnect = (provider: Provider) =>
    withBusy(async () => {
      const res = await apiDelete(`/api/integrations/connections/${provider}`);
      if (!res.ok && res.status !== 204) {
        setError(t('error'));
        return;
      }
      await load();
    });

  const mutateAndReload = (call: () => Promise<Response>) =>
    withBusy(async () => {
      const res = await call();
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t('error'));
        return;
      }
      await load();
    });

  const saveNotionMapping = () =>
    mutateAndReload(() => apiPut('/api/integrations/notion/mapping', { database_id: notionDb }));

  const saveAirtableMapping = () =>
    mutateAndReload(() =>
      apiPut('/api/integrations/airtable/mapping', { base_id: airtableBase, table_id: airtableTable }),
    );

  const runAction = (path: string) => mutateAndReload(() => apiPost(path, {}));

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
            <ConnectionButton
              connected={statusOf('notion') === 'connected'}
              busy={busy}
              onConnect={() => void connect('notion')}
              onDisconnect={() => void disconnect('notion')}
            />
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
            <ConnectionButton
              connected={statusOf('airtable') === 'connected'}
              busy={busy}
              onConnect={() => void connect('airtable')}
              onDisconnect={() => void disconnect('airtable')}
            />
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
          <RunsList runs={runs} />
        </CardContent>
      </Card>
    </div>
  );
}
