'use client';

import { useAuth } from '@/app/auth/useAuth';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { AutomationWorkloadWidget } from './components/AutomationWorkloadWidget';
import { ContractsByMonthChart } from './components/ContractsByMonthChart';
import { ContractsByLugarChart } from './components/ContractsByLugarChart';
import { CorporateVsIndependentChart } from './components/CorporateVsIndependentChart';
import { RecentContracts } from './components/RecentContracts';
import { ImpactTrendsChart } from './components/ImpactTrendsChart';
import { useDashboardStats, type DashboardStats } from './useDashboardStats';
import { useImpactTrends, type ImpactTrendResult } from './useImpactTrends';
import { useAutomationWorkload } from './useAutomationWorkload';
import {
  buildTrendsMap,
} from '@/modules/impact/components/ImpactKpiGrid';
import { ImpactKpiGrid } from '@/modules/impact/components/ImpactKpiGrid';
import { currentMonthPeriod, useImpactKpis } from '@/modules/impact/hooks/useImpactKpis';
import {
  COORDINATOR_KPI_ORDER,
} from '@/modules/impact/types';

function DashboardLowerSections({
  stats,
  statsLoading,
  statsError,
  trends,
  trendsLoading,
}: {
  stats: DashboardStats | null;
  statsLoading: boolean;
  statsError: string | null;
  trends: ImpactTrendResult[] | undefined;
  trendsLoading: boolean;
}) {
  if (statsLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {statsError}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ContractsByMonthChart data={stats.contractsByMonth} />
        <ContractsByLugarChart data={stats.contractsByLugar} />
      </div>

      {/* Impact Trends Chart */}
      <ImpactTrendsChart data={trends || []} isLoading={trendsLoading} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CorporateVsIndependentChart
          corporate={stats.corporateVsIndependent.corporate}
          independent={stats.corporateVsIndependent.independent}
        />
        <div className="md:col-span-2">
          <RecentContracts contracts={stats.recentContracts} />
        </div>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useImpactTrends('12months');
  const { metrics: automationMetrics, manualTasks, isLoading: automationLoading } = useAutomationWorkload();
  const router = useRouter();

  const monthPeriod = currentMonthPeriod();
  // Badges use the same monthly window as the cards; the 12-month series
  // below keeps feeding the history chart.
  const { data: badgeTrends } = useImpactTrends(isAuthenticated ? monthPeriod : undefined);
  const {
    kpis: visibleImpactKpis,
    config: impactConfig,
    loading: impactLoading,
    error: impactError,
    refresh: fetchImpactKpis,
  } = useImpactKpis({
    enabled: isAuthenticated,
    period: monthPeriod,
    includeKeys: COORDINATOR_KPI_ORDER,
    order: COORDINATOR_KPI_ORDER,
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && (user as any).role !== 'admin') {
      router.replace('/admin/contratos');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const trendsByKpi = buildTrendsMap(badgeTrends);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('titulo')}</h2>

      <ImpactKpiGrid
        kpis={impactLoading ? null : visibleImpactKpis}
        trendsByKpi={trendsByKpi}
        isLoading={impactLoading}
        error={impactError}
        onRetry={fetchImpactKpis}
        showEstimateBadge={impactConfig?.showEstimateBadge ?? true}
        showExplanations
        expectedKeys={COORDINATOR_KPI_ORDER}
      />

      {!automationLoading && automationMetrics ? (
        <AutomationWorkloadWidget
          metrics={automationMetrics}
          manualCount={manualTasks.length}
        />
      ) : null}

      <DashboardLowerSections
        stats={stats}
        statsLoading={statsLoading}
        statsError={statsError}
        trends={trends}
        trendsLoading={trendsLoading}
      />
    </div>
  );
}
