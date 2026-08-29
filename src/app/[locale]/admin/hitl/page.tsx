'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useHitlInbox, type HitlQueueItem } from './useHitlInbox';

export default function HitlInboxPage() {
  const t = useTranslations('admin.hitl');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, kpi, isLoading, error, allow, deny, edit } = useHitlInbox();
  const [editing, setEditing] = useState<HitlQueueItem | null>(null);
  const [draft, setDraft] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  if (authLoading) return <Skeleton className="h-8 w-48" />;
  if (!isAuthenticated) return null;

  const run = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={t('kpiSubmitted')} value={kpi?.submittedOutputs} />
        <KpiCard label={t('kpiUnsigned')} value={kpi?.outputsWithoutSignOff} />
        <KpiCard label={t('kpiPending')} value={kpi?.pending} />
      </div>
      {(error || actionError) && (
        <p className="text-sm text-destructive">{error || actionError}</p>
      )}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3">{t('action')}</th>
                <th className="p-3">{t('diff')}</th>
                <th className="p-3">{t('scopes')}</th>
                <th className="p-3">{t('plane')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="p-3 font-medium">{item.actionType}</td>
                  <td className="max-w-xs whitespace-pre-wrap p-3">{item.payloadDiff}</td>
                  <td className="p-3">{item.scopes}</td>
                  <td className="p-3">
                    <Badge variant={item.plane === 'hot' ? 'default' : 'secondary'}>{item.plane}</Badge>
                  </td>
                  <td className="space-x-2 p-3 text-right">
                    <Button size="sm" onClick={() => run(() => allow(item.id))}>
                      {t('allow')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => run(() => deny(item.id))}>
                      {t('deny')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(item);
                        setDraft(item.payloadDiff);
                      }}
                    >
                      {t('edit')}
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={5}>
                    {t('empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
          </DialogHeader>
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={6} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() =>
                run(async () => {
                  if (!editing) return;
                  await edit(editing.id, draft);
                  setEditing(null);
                })
              }
            >
              {t('saveEdit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value ?? '—'}</p>
      </CardContent>
    </Card>
  );
}
