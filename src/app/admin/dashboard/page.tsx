'use client';

import { useAuth } from '@/app/auth/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCards } from './components/MetricCards';
import { ContractsByMonthChart } from './components/ContractsByMonthChart';
import { ContractsByLugarChart } from './components/ContractsByLugarChart';
import { CorporateVsIndependentChart } from './components/CorporateVsIndependentChart';
import { RecentContracts } from './components/RecentContracts';
import { useDashboardStats } from './useDashboardStats';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { stats, isLoading, error } = useDashboardStats();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && (user as any).role !== 'admin') {
      router.replace('/admin/contratos');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-lg md:col-span-1" />
          <Skeleton className="h-64 w-full rounded-lg md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold">Dashboard</h2>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <MetricCards
        totalContracts={stats.totalContracts}
        activeVolunteers={stats.activeVolunteers}
        surveyCompletionRate={stats.surveyCompletionRate}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ContractsByMonthChart data={stats.contractsByMonth} />
        <ContractsByLugarChart data={stats.contractsByLugar} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CorporateVsIndependentChart
          corporate={stats.corporateVsIndependent.corporate}
          independent={stats.corporateVsIndependent.independent}
        />
        <div className="md:col-span-2">
          <RecentContracts contracts={stats.recentContracts} />
        </div>
      </div>
    </div>
  );
}
