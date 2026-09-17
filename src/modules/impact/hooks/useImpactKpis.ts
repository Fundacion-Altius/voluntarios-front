'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, apiUrl } from '@/lib/apiClient';
import type { ImpactKpi, ImpactKpiResponse } from '@/modules/impact/types';
import {
  filterKpisByVisibleKeys,
  readImpactConfig,
  sortKpisByOrder,
  type ImpactConfig,
} from '@/modules/impact/components/ImpactKpiGrid';

export function currentMonthPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useImpactKpis({
  enabled = true,
  period,
  includeKeys,
  order,
}: {
  enabled?: boolean;
  period?: string;
  includeKeys?: readonly string[];
  order?: readonly string[];
} = {}) {
  const [rawKpis, setRawKpis] = useState<ImpactKpi[] | null>(null);
  const [config, setConfig] = useState<ImpactConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = period
        ? apiUrl(`/api/impact/kpis?period=${encodeURIComponent(period)}`)
        : apiUrl('/api/impact/kpis');
      const result = await apiClient<ImpactKpiResponse>(url);
      if (!result.success) {
        setError(result.error || 'Failed to fetch impact KPIs');
        setRawKpis(null);
        return;
      }
      const data = result.data;
      if (data.success && data.data) {
        setRawKpis(data.data);
      } else {
        setError(data.error || 'Failed to load impact data');
        setRawKpis(null);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setConfig(readImpactConfig());
    if (enabled) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [enabled, refresh]);

  const kpis = useMemo(() => {
    const scoped = includeKeys
      ? (rawKpis ?? []).filter((kpi) => includeKeys.includes(kpi.key))
      : (rawKpis ?? []);
    const visible = filterKpisByVisibleKeys(scoped, config?.enabledKpis);
    return order ? sortKpisByOrder(visible, order) : visible;
  }, [rawKpis, config, includeKeys, order]);

  return { kpis, config, loading, error, refresh };
}
