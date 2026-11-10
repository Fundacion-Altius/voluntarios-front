'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, apiUrl } from '@/lib/apiClient';
import type { PublicImpactConfig } from '@/modules/impact/catalog';
import {
  filterKpisByVisibleKeys,
  sortKpisByOrder,
  type ImpactConfig,
} from '@/modules/impact/components/ImpactKpiGrid';
import type { ImpactKpi, ImpactKpiResponse } from '@/modules/impact/types';

export function currentMonthPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

type PublicConfigResponse = { success: boolean; data?: PublicImpactConfig; error?: string };

export function useImpactKpis({
  enabled = true,
  period,
  includeKeys,
  order,
  /** When true, load publicKeys from tenant API instead of localStorage. */
  useTenantPublicConfig = false,
}: {
  enabled?: boolean;
  period?: string;
  includeKeys?: readonly string[];
  order?: readonly string[];
  useTenantPublicConfig?: boolean;
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

      if (useTenantPublicConfig) {
        const cfgRes = await apiClient<PublicConfigResponse>(apiUrl('/api/impact/public-config'));
        if (cfgRes.success && cfgRes.data?.success && cfgRes.data.data) {
          const pub = cfgRes.data.data;
          setConfig({
            organizationName: pub.organizationName,
            organizationLogo: pub.organizationLogo,
            enabledKpis: pub.publicKeys,
            showEstimateBadge: pub.showEstimateBadge,
          });
        } else {
          setConfig({
            organizationName: '',
            organizationLogo: '',
            enabledKpis: [],
            showEstimateBadge: true,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [period, useTenantPublicConfig]);

  useEffect(() => {
    if (enabled) {
      void refresh();
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

  return { kpis, rawKpis: rawKpis ?? [], config, loading, error, refresh };
}
