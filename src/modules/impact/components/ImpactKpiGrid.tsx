'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCountUp } from '@/modules/impact/hooks/useCountUp';
import {
  ALL_IMPACT_KPI_KEYS,
  type ImpactKpi,
  type ImpactKpiKey,
  type ImpactTrendSummary,
} from '@/modules/impact/types';

export const CANONICAL_IMPACT_KPI_ORDER: readonly ImpactKpiKey[] =
  ALL_IMPACT_KPI_KEYS;

export type TrendsByKpi = Record<string, ImpactTrendSummary>;

export function sortKpisByOrder(
  kpis: ImpactKpi[],
  order: readonly string[] = CANONICAL_IMPACT_KPI_ORDER,
): ImpactKpi[] {
  const rank = new Map<string, number>(order.map((key, index) => [key, index]));
  return [...kpis].sort(
    (a, b) => (rank.get(a.key) ?? 99) - (rank.get(b.key) ?? 99),
  );
}

export function sortKpisByCanonicalOrder(kpis: ImpactKpi[]): ImpactKpi[] {
  return sortKpisByOrder(kpis);
}

export function filterKpisByVisibleKeys(
  kpis: ImpactKpi[],
  visibleKeys: readonly string[] | null | undefined,
): ImpactKpi[] {
  if (!visibleKeys) return kpis;
  const visible = new Set(visibleKeys);
  return kpis.filter((kpi) => visible.has(kpi.key));
}

export type ImpactConfig = {
  organizationName: string;
  organizationLogo: string;
  enabledKpis: readonly string[];
  showEstimateBadge: boolean;
};

export function readImpactConfig(): ImpactConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('impactConfig');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ImpactConfig>;
    if (!parsed || !Array.isArray(parsed.enabledKpis)) return null;
    return {
      organizationName: parsed.organizationName ?? '',
      organizationLogo: parsed.organizationLogo ?? '',
      enabledKpis: parsed.enabledKpis,
      showEstimateBadge: parsed.showEstimateBadge ?? true,
    };
  } catch {
    return null;
  }
}

export function buildTrendsMap(
  data: Array<{
    kpi: string;
    current: { direction: ImpactTrendSummary['direction']; percentChange: number } | null;
  }> | null | undefined,
): TrendsByKpi {
  const map: TrendsByKpi = {};
  if (!data) return map;
  for (const entry of data) {
    if (entry?.current) {
      map[entry.kpi] = {
        direction: entry.current.direction,
        percentChange: entry.current.percentChange,
      };
    }
  }
  return map;
}

function TrendBadge({ trend }: { trend: ImpactTrendSummary | undefined }) {
  const t = useTranslations('impact.dashboard');
  if (!trend) return null;
  const colorClass =
    trend.direction === 'up'
      ? 'text-green-600'
      : trend.direction === 'down'
        ? 'text-red-600'
        : 'text-gray-500';
  const symbol =
    trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass}`}
      aria-label={`trend-${trend.direction}`}
      title={t(`trend.${trend.direction}`)}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{trend.percentChange.toFixed(1)}%</span>
    </span>
  );
}

const UNIT_MESSAGE_KEYS: Record<string, string> = {
  hours: 'unit.hours',
  people: 'unit.people',
  'people/hour': 'unit.perHour',
};

function ExplanationTooltip({ kpiKey }: { kpiKey: string }) {
  const t = useTranslations('impact.dashboard');
  const description = t(`kpiDesc.${kpiKey}`);
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={description}
            className="inline-flex cursor-help items-center text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ImpactKpiCard({
  kpi,
  trend,
  showEstimateBadge = true,
  showExplanation = false,
}: {
  kpi: ImpactKpi;
  trend?: ImpactTrendSummary;
  showEstimateBadge?: boolean;
  showExplanation?: boolean;
}) {
  const t = useTranslations('impact.dashboard');
  const displayName = t(`kpi.${kpi.key}`);
  const unitKey = UNIT_MESSAGE_KEYS[kpi.unit];
  const unitLabel = unitKey ? t(unitKey) : kpi.unit;
  const animated = useCountUp(kpi.value);
  const displayValue =
    animated === kpi.value
      ? kpi.value.toLocaleString()
      : Number(animated.toFixed(2)).toLocaleString();
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {displayName}
          {showEstimateBadge && kpi.isEstimate && (
            <Badge variant="secondary" className="text-xs">
              {t('estimateBadge')}
            </Badge>
          )}
          {showExplanation && <ExplanationTooltip kpiKey={kpi.key} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {displayValue}
          {unitLabel && (
            <span className="text-sm font-normal text-muted-foreground">
              {' '}
              {unitLabel}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Periodo: {kpi.period}</p>
          <TrendBadge trend={trend} />
        </div>
      </CardContent>
    </Card>
  );
}

function MissingKpiCard({
  kpiKey,
  showExplanation = false,
}: {
  kpiKey: string;
  showExplanation?: boolean;
}) {
  const t = useTranslations('impact.dashboard');
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {t(`kpi.${kpiKey}`)}
          {showExplanation && <ExplanationTooltip kpiKey={kpiKey} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t('kpiNoData')}</p>
      </CardContent>
    </Card>
  );
}

export function ImpactKpiGrid({
  kpis,
  trendsByKpi,
  isLoading = false,
  error = null,
  onRetry,
  showEstimateBadge = true,
  showExplanations = false,
  expectedKeys,
}: {
  kpis: ImpactKpi[] | null;
  trendsByKpi?: TrendsByKpi;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showEstimateBadge?: boolean;
  showExplanations?: boolean;
  expectedKeys?: readonly string[];
}) {
  const t = useTranslations('impact.dashboard');
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: expectedKeys?.length ?? 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <button
          type="button"
          onClick={onRetry ?? (() => window.location.reload())}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return <p className="text-muted-foreground">{t('empty')}</p>;
  }

  const present = new Set<string>(kpis.map((kpi) => kpi.key));
  const missing = (expectedKeys ?? []).filter((key) => !present.has(key));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <ImpactKpiCard
          key={kpi.key}
          kpi={kpi}
          trend={trendsByKpi?.[kpi.key]}
          showEstimateBadge={showEstimateBadge}
          showExplanation={showExplanations}
        />
      ))}
      {missing.map((key) => (
        <MissingKpiCard key={key} kpiKey={key} showExplanation={showExplanations} />
      ))}
    </div>
  );
}
