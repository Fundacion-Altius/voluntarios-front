'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ImpactKpi, ImpactKpiResponse } from '@/modules/impact/types';

const KPI_DISPLAY_NAMES: Record<string, string> = {
  volunteer_hours_total: 'Horas de voluntariado',
  people_served_estimated: 'Personas atendidas (estimado)',
  volunteer_retention_rate: 'Tasa de retención de voluntarios',
  community_satisfaction: 'Satisfacción de la comunidad',
  volunteer_growth_rate: 'Crecimiento de voluntarios',
};

const KPI_UNIT_LABELS: Record<string, string> = {
  hours: 'horas',
  people: 'personas',
  '%': '%',
  '1-5': '/5',
};

function KpiCard({ kpi }: { kpi: ImpactKpi }) {
  const displayName = KPI_DISPLAY_NAMES[kpi.key] || kpi.key;
  const unitLabel = KPI_UNIT_LABELS[kpi.unit] || kpi.unit;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {displayName}
          {kpi.isEstimate && (
            <Badge variant="secondary" className="text-xs">
              Estimado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {kpi.value.toLocaleString()}
          {unitLabel && <span className="text-sm font-normal text-muted-foreground"> {unitLabel}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Periodo: {kpi.period}
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function PublicImpactDashboardPage() {
  const t = useTranslations('impact.dashboard');
  const [kpis, setKpis] = useState<ImpactKpi[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKpis() {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient<ImpactKpiResponse>(apiUrl('/api/impact/kpis'));

        if (!result.success) {
          setError(result.error || 'Failed to fetch impact KPIs');
          return;
        }

        const data = result.data;
        if (data.success && data.data) {
          setKpis(data.data);
        } else {
          setError(data.error || 'Failed to load impact data');
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    fetchKpis();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">No hay datos de impacto disponibles.</p>
    </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('dataNote')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
