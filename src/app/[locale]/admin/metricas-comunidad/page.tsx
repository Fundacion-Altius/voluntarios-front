'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface Kpis {
  active_volunteers: number;
  active_donors: number;
  engagement_score: number;
  retention_rate: number;
  at_risk_count: number;
}

interface ChurnRisk {
  id: string;
  display_name: string;
  role: string;
  risk: string;
  days_inactive: number;
}

export default function MetricasComunidadPage() {
  const t = useTranslations('admin.metricasComunidad');
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [risks, setRisks] = useState<ChurnRisk[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/community-metrics/seed-demo', {});
      const res = await apiGet('/api/community-metrics/dashboard');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as { kpis?: Kpis; churn_risks?: ChurnRisk[] };
      setKpis(data.kpis || null);
      setRisks(data.churn_risks || []);
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

  const runDetection = async () => {
    setBusy(true);
    try {
      const res = await apiPost('/api/community-metrics/run-detection', {});
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as { kpis?: Kpis; churn_risks?: ChurnRisk[] };
      setKpis(data.kpis || null);
      setRisks(data.churn_risks || []);
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button type="button" onClick={() => void runDetection()} disabled={busy}>
          {t('runDetection')}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {kpis ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('kpisTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm">
            <span>
              {t('activeVolunteers')}: <strong>{kpis.active_volunteers}</strong>
            </span>
            <span>
              {t('activeDonors')}: <strong>{kpis.active_donors}</strong>
            </span>
            <span>
              {t('engagementScore')}: <strong>{kpis.engagement_score}</strong>
            </span>
            <span>
              {t('retentionRate')}: <strong>{kpis.retention_rate}%</strong>
            </span>
            <span>
              {t('atRisk')}: <strong>{kpis.at_risk_count}</strong>
            </span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('churnTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!risks.length ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colName')}</TableHead>
                  <TableHead>{t('colRole')}</TableHead>
                  <TableHead>{t('colRisk')}</TableHead>
                  <TableHead>{t('colDays')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.display_name}</TableCell>
                    <TableCell>{t(`role.${r.role}`)}</TableCell>
                    <TableCell>{t(`risk.${r.risk}`)}</TableCell>
                    <TableCell>{r.days_inactive}</TableCell>
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
