'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { getCatalogItem, type PublicImpactConfig } from '@/modules/impact/catalog';
import { formatImpactNumber, localizeImpactUnit } from '@/modules/impact/formatNumber';
import { currentMonthPeriod } from '@/modules/impact/hooks/useImpactKpis';
import type { ImpactKpi, ImpactKpiResponse } from '@/modules/impact/types';

type PublicConfigResponse = { success: boolean; data?: PublicImpactConfig; error?: string };

const EMPTY_PUBLIC_CONFIG: PublicImpactConfig = {
  organizationName: '',
  organizationLogo: '',
  showEstimateBadge: true,
  publicKeys: [],
  figures: [],
};

async function fetchPublicImpact(period: string): Promise<{ pub: PublicImpactConfig; kpis?: ImpactKpi[] }> {
  const [cfgRes, kpiRes] = await Promise.all([
    apiClient<PublicConfigResponse>(apiUrl('/api/impact/public-config')),
    apiClient<ImpactKpiResponse>(apiUrl(`/api/impact/kpis?period=${encodeURIComponent(period)}`)),
  ]);
  const cfg = cfgRes.success && cfgRes.data?.success ? cfgRes.data.data : undefined;
  const kpis = kpiRes.success && kpiRes.data?.success ? kpiRes.data.data : undefined;
  return { pub: cfg || EMPTY_PUBLIC_CONFIG, kpis: kpis || undefined };
}

function withUnit(value: number, unit: string | undefined, locale: string): string {
  const formatted = formatImpactNumber(value, locale);
  return unit ? `${formatted} ${unit}` : formatted;
}

function figureValue(
  fig: PublicImpactConfig['figures'][number],
  kpi: ImpactKpi | undefined,
  units: { manual: string | undefined; kpi: string | undefined },
  locale: string,
): string {
  if (fig.manualValue != null) return withUnit(fig.manualValue, units.manual, locale);
  if (kpi) return withUnit(kpi.value, units.kpi, locale);
  return '—';
}

export default function PublicImpactDashboardPage() {
  const t = useTranslations('impact.dashboard');
  const ti = useTranslations('admin.impact');
  const locale = useLocale();
  const monthPeriod = currentMonthPeriod();
  const [pub, setPub] = useState<PublicImpactConfig | null>(null);
  const [kpis, setKpis] = useState<ImpactKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicImpact(monthPeriod)
      .then((result) => {
        if (cancelled) return;
        setPub(result.pub);
        if (result.kpis) setKpis(result.kpis);
      })
      .catch(() => {
        if (!cancelled) setError(t('error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthPeriod, t]);

  const figures = useMemo(() => {
    const list = pub?.figures ?? [];
    return list.map((fig) => {
      const item = getCatalogItem(fig.key);
      const kpi = item?.mapsToKpi ? kpis.find((k) => k.key === item.mapsToKpi) : undefined;
      const manualUnit = localizeImpactUnit(fig.manualUnit, (key) => t(`unit.${key}`));
      const kpiUnit = localizeImpactUnit(kpi?.unit, (key) => t(`unit.${key}`));
      const value = figureValue(fig, kpi, { manual: manualUnit, kpi: kpiUnit }, locale);
      return {
        key: fig.key,
        value,
        isEstimate: fig.isEstimate || kpi?.isEstimate,
        title: ti(`catalog.${fig.key}.title`),
        line: ti(`catalog.${fig.key}.publicLine`),
      };
    });
  }, [pub, kpis, ti, t, locale]);

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
