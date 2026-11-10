'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/apiUrl';

export type ImpactTrendResult = {
  kpi: string;
  current: {
    key: string;
    currentValue: number;
    comparisonValue: number;
    percentChange: number;
    direction: 'up' | 'down' | 'stable';
    windowMonths: number;
  } | null;
  history: {
    period: string;
    value: number;
    kpi: string;
  }[];
};

async function fetchImpactTrends(period?: string): Promise<ImpactTrendResult[]> {
  const apiUrl = getApiBaseUrl();
  const url = new URL(`${apiUrl}/api/impact/trends`);

  if (period) {
    url.searchParams.set('period', period);
  }

  const response = await fetch(url.toString(), {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return Promise.reject(new Error(errorData.message || errorData.error || `Failed to fetch impact trends: ${response.status}`));
  }

  const data = await response.json();

  if (data.success) {
    return data.data;
  }

  return Promise.reject(new Error(data.error || 'Failed to fetch impact trends'));
}

export function useImpactTrends(period?: string) {
  return useQuery({
    queryKey: ['impact-trends', period],
    queryFn: () => fetchImpactTrends(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
