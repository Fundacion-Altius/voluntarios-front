'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildTrendsMap,
  type TrendsByKpi,
} from '@/modules/impact/components/ImpactKpiGrid';
import { ImpactKpiGrid } from '@/modules/impact/components/ImpactKpiGrid';
import { useImpactKpis } from '@/modules/impact/hooks/useImpactKpis';
import { PUBLIC_KPI_ORDER } from '@/modules/impact/types';

type ImpactTrendsResponse = {
  success: boolean;
  data?: Array<{
    kpi: string;
    current: { direction: 'up' | 'down' | 'stable'; percentChange: number } | null;
  }>;
  error?: string;
};

function OrganizationBranding({
  name,
  logo,
}: {
  name: string | null;
  logo: string | null;
}) {
  if (!name && !logo) return null;
  return (
    <div className="mb-3 flex items-center gap-3">
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name ?? 'Organization logo'}
          className="h-10 w-10 rounded object-contain"
        />
      )}
      {name && <p className="text-lg font-semibold">{name}</p>}
    </div>
  );
}

export default function PublicImpactDashboardPage() {
  const t = useTranslations('impact.dashboard');
  // Public view keeps its legacy 8 cards (all-time); the coordinator
  // reconciliation applies to the admin dashboard only.
  const { kpis, config, loading, error, refresh } = useImpactKpis({
    includeKeys: PUBLIC_KPI_ORDER,
    order: PUBLIC_KPI_ORDER,
  });
  const [trendsByKpi, setTrendsByKpi] = useState<TrendsByKpi>({});

  useEffect(() => {
    async function fetchTrends() {
      try {
        const trendsResult = await apiClient<ImpactTrendsResponse>(
          apiUrl('/api/impact/trends?period=12months'),
        );
        if (trendsResult.success && trendsResult.data.success) {
          setTrendsByKpi(buildTrendsMap(trendsResult.data.data));
        }
      } catch {
        setTrendsByKpi({});
      }
    }
    fetchTrends();
  }, []);

  const showEstimateBadge = config?.showEstimateBadge ?? true;
  const organizationLogo =
    config?.organizationLogo && config.organizationLogo !== '/logo.png'
      ? config.organizationLogo
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <OrganizationBranding
          name={config?.organizationName ?? null}
          logo={organizationLogo}
        />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <ImpactKpiGrid
        kpis={loading ? null : kpis}
        trendsByKpi={trendsByKpi}
        isLoading={loading}
        error={error}
        onRetry={refresh}
        showEstimateBadge={showEstimateBadge}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('dataNote')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
