'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { comanderoApi } from '@/modules/comandero/api';
import type { SessionSummary } from '@/modules/comandero/types';
import { useComanderoFloor } from '@/modules/comandero/useComandero';
import { LiveSession } from './LiveSession';
import { StartSessionForm } from './StartSessionForm';
import { SummaryCard } from './SummaryCard';

/** The practice session (docente): start a service, run it live, close it and read the summary. */
export function SessionCard() {
  const t = useTranslations('comandero.admin.session');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const { floor, refresh } = useComanderoFloor(sessionId);

  const start = async (label: string) => {
    setBusy(true);
    const res = await comanderoApi.startSession({ label });
    setBusy(false);
    if (!res.success) return;
    setSessionId(res.data.id);
    setSummary(null);
  };

  const addTable = async (label: string) => {
    if (!sessionId) return;
    await comanderoApi.addTable(sessionId, label);
    await refresh();
  };

  const close = async () => {
    if (!sessionId) return;
    setBusy(true);
    const res = await comanderoApi.closeSession(sessionId, {});
    setBusy(false);
    if (!res.success) return;
    setSummary(res.data);
    setSessionId(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('title')}</CardTitle>
        {sessionId && (
          <Button variant="outline" size="icon" aria-label={t('refresh')} onClick={() => refresh()}>
            <RefreshCw className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionId ? (
          <LiveSession floor={floor} busy={busy} onAddTable={addTable} onClose={close} />
        ) : (
          <StartSessionForm busy={busy} onStart={start} />
        )}
        {summary && <SummaryCard summary={summary} />}
      </CardContent>
    </Card>
  );
}
