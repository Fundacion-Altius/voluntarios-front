'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { getCatalogItem, type PublicImpactConfig } from '@/modules/impact/catalog';
import { currentMonthPeriod } from '@/modules/impact/hooks/useImpactKpis';
import type { ImpactKpi, ImpactKpiResponse } from '@/modules/impact/types';

type PublicConfigResponse = { success: boolean; data?: PublicImpactConfig; error?: string };

export default function PublicImpactDashboardPage() {
  const t = useTranslations('impact.dashboard');
  const ti = useTranslations('admin.impact');
  const monthPeriod = currentMonthPeriod();
  const [pub, setPub] = useState<PublicImpactConfig | null>(null);
  const [kpis, setKpis] = useState<ImpactKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cfgRes, kpiRes] = await Promise.all([
          apiClient<PublicConfigResponse>(apiUrl('/api/impact/public-config')),
          apiClient<ImpactKpiResponse>(
            apiUrl(`/api/impact/kpis?period=${encodeURIComponent(monthPeriod)}`),
          ),
        ]);
        if (cancelled) return;
        if (cfgRes.success && cfgRes.data?.success && cfgRes.data.data) {
          setPub(cfgRes.data.data);
        } else {
          setPub({
            organizationName: '',
            organizationLogo: '',
            showEstimateBadge: true,
            publicKeys: [],
            selectedKeys: [],
            figures: [],
          });
        }
        if (kpiRes.success && kpiRes.data?.success && kpiRes.data.data) {
          setKpis(kpiRes.data.data);
        }
      } catch {
        if (!cancelled) setError(t('error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthPeriod, t]);

  const figures = useMemo(() => {
    const list = pub?.figures ?? [];
    return list.map((fig) => {
      const item = getCatalogItem(fig.key);
      const kpi = item?.mapsToKpi ? kpis.find((k) => k.key === item.mapsToKpi) : undefined;
      const value =
        fig.manualValue != null
          ? fig.manualUnit
            ? `${fig.manualValue} ${fig.manualUnit}`
            : String(fig.manualValue)
          : kpi
            ? kpi.unit === '%'
              ? `${kpi.value} %`
              : String(kpi.value)
            : '—';
      return {
        key: fig.key,
        value,
        isEstimate: fig.isEstimate || kpi?.isEstimate,
        title: ti(`catalog.${fig.key}.title`),
        line: ti(`catalog.${fig.key}.publicLine`),
      };
    });
  }, [pub, kpis, ti]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        {pub?.organizationName && (
          <p className="text-sm font-semibold text-primary">{pub.organizationName}</p>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {pub?.publicHeadline || t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && figures.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t('empty')}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {figures.map((fig) => (
          <div key={fig.key} className="rounded-[10px] border border-border bg-card p-4">
            <div className="text-2xl font-bold tracking-tight">{fig.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{fig.line || fig.title}</div>
            {pub?.showEstimateBadge && fig.isEstimate && (
              <span className="mt-2 inline-flex rounded-[5px] border border-border bg-muted px-1.5 py-0.5 text-[11px] font-bold">
                {ti('estimated')}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>{t('dataNote')}</span>
        <span className="font-semibold text-primary">{ti('madeWithKlaruk')}</span>
      </div>
    </div>
  );
}
