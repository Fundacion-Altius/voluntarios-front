'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminStepper, type AdminStep } from '@/modules/comandero/components/admin/AdminStepper';
import { LiveSession } from '@/modules/comandero/components/admin/LiveSession';
import { MenuCard } from '@/modules/comandero/components/admin/MenuCard';
import { StartSessionForm } from '@/modules/comandero/components/admin/StartSessionForm';
import { SummaryCard } from '@/modules/comandero/components/admin/SummaryCard';
import { comanderoApi } from '@/modules/comandero/api';
import type { SessionSummary } from '@/modules/comandero/types';
import { useComanderoFloor } from '@/modules/comandero/useComandero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComanderoAdminPage() {
  const t = useTranslations('comandero.admin');
  const [step, setStep] = useState<AdminStep>('carta');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const { floor, refresh } = useComanderoFloor(sessionId);

  useEffect(() => {
    if (summary) setStep('cierre');
    else if (sessionId) setStep('sala');
  }, [sessionId, summary]);

  const start = async (label: string) => {
    setBusy(true);
    const res = await comanderoApi.startSession({ label });
    setBusy(false);
    if (!res.success) return;
    setSessionId(res.data.id);
    setSummary(null);
    setStep('sala');
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
    setStep('cierre');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1" data-testid="comandero-admin">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <AdminStepper
        step={step}
        onStep={setStep}
        canOpenSala={Boolean(sessionId)}
        canOpenCierre={Boolean(summary)}
      />

      {step === 'carta' && <MenuCard />}

      {step === 'abrir' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('session.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionId ? (
              <p className="text-sm text-muted-foreground">{t('session.alreadyOpen')}</p>
            ) : (
              <StartSessionForm busy={busy} onStart={start} />
            )}
          </CardContent>
        </Card>
      )}

      {step === 'sala' && sessionId && (
        <LiveSession floor={floor} busy={busy} onAddTable={addTable} onClose={close} />
      )}

      {step === 'cierre' && (
        <div className="space-y-4">
          {summary && <SummaryCard summary={summary} />}
          <Card>
            <CardHeader>
              <CardTitle>{t('session.newAfterClose')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StartSessionForm busy={busy} onStart={start} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
