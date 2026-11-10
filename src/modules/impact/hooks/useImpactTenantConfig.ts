'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, apiUrl } from '@/lib/apiClient';
import type {
  ImpactCatalogItem,
  PublicImpactConfig,
  TenantImpactConfig,
} from '@/modules/impact/catalog';

type ApiOk<T> = { success: boolean; data?: T; error?: string };

export function useImpactTenantConfig({ enabled = true }: { enabled?: boolean } = {}) {
  const [config, setConfig] = useState<TenantImpactConfig | null>(null);
  const [catalog, setCatalog] = useState<ImpactCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, catRes] = await Promise.all([
        apiClient<ApiOk<TenantImpactConfig>>(apiUrl('/api/impact/config')),
        apiClient<ApiOk<ImpactCatalogItem[]>>(apiUrl('/api/impact/catalog')),
      ]);
      if (!cfgRes.success || !cfgRes.data?.success || !cfgRes.data.data) {
        setError(cfgRes.error || cfgRes.data?.error || 'Failed to load impact config');
        setConfig(null);
      } else {
        setConfig(cfgRes.data.data);
      }
      if (catRes.success && catRes.data?.success && catRes.data.data) {
        setCatalog(catRes.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveConfig = useCallback(
    async (patch: Partial<TenantImpactConfig>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient.put<ApiOk<TenantImpactConfig>>(
          apiUrl('/api/impact/config'),
          patch,
        );
        if (!res.success || !res.data?.success || !res.data.data) {
          setError(res.error || res.data?.error || 'Failed to save');
          return null;
        }
        setConfig(res.data.data);
        return res.data.data;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const setManualValue = useCallback(
    async (body: {
      key: string;
      value: number;
      unit?: string;
      evidence?: string;
      isEstimate?: boolean;
      showOnPublicPage?: boolean;
    }) => {
      setSaving(true);
      setError(null);
      try {
        const res = await apiClient.post<ApiOk<TenantImpactConfig>>(
          apiUrl('/api/impact/config/manual-value'),
          body,
        );
        if (!res.success || !res.data?.success || !res.data.data) {
          setError(res.error || res.data?.error || 'Failed to save value');
          return null;
        }
        setConfig(res.data.data);
        return res.data.data;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    config,
    catalog,
    loading,
    error,
    saving,
    refresh,
    saveConfig,
    setManualValue,
  };
}

export function usePublicImpactConfig() {
  const [config, setConfig] = useState<PublicImpactConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await apiClient<ApiOk<PublicImpactConfig>>(
        apiUrl('/api/impact/public-config'),
      );
      if (!cancelled) {
        if (res.success && res.data?.success && res.data.data) {
          setConfig(res.data.data);
        } else {
          setConfig(null);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
