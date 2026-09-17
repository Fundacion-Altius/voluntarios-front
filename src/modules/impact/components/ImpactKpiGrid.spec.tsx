import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TestProviders } from '@/app/test-utils';
import enMessages from '../../../../messages/en.json';
import type { ImpactKpi } from '@/modules/impact/types';
import {
  ALL_IMPACT_KPI_KEYS,
  COORDINATOR_KPI_ORDER,
  PUBLIC_KPI_ORDER,
} from '@/modules/impact/types';
import {
  buildTrendsMap,
  filterKpisByVisibleKeys,
  ImpactKpiGrid,
  sortKpisByCanonicalOrder,
  sortKpisByOrder,
} from './ImpactKpiGrid';

function makeKpi(key: string, value = 1, unit?: string): ImpactKpi {
  return {
    key: key as ImpactKpi['key'],
    value,
    period: '2026-Q1',
    isEstimate: key === 'people_served_estimated',
    unit: unit ?? (key === 'community_satisfaction' ? '1-5' : '%'),
  };
}

describe('ImpactKpiGrid helpers', () => {
  it('exposes the 8 coordinator KPIs in dashboard order', () => {
    expect([...COORDINATOR_KPI_ORDER]).toEqual([
      'coverage_rate',
      'reliability_rate',
      'volunteer_churn_rate',
      'volunteer_retention_rate',
      'time_to_fill',
      'onboarding_completion_rate',
      'social_impact_per_hour',
      'volunteer_nps',
    ]);
  });

  it('keeps the legacy public order and full key list', () => {
    expect([...PUBLIC_KPI_ORDER]).toEqual([
      'volunteer_hours_total',
      'people_served_estimated',
      'community_satisfaction',
      'volunteer_retention_rate',
      'volunteer_churn_rate',
      'volunteer_growth_rate',
      'coverage_rate',
      'time_to_fill',
    ]);
    expect(ALL_IMPACT_KPI_KEYS).toHaveLength(12);
  });

  it('sorts KPIs by a given order regardless of input order', () => {
    const shuffled = [...COORDINATOR_KPI_ORDER].reverse().map((key) => makeKpi(key));
    const sorted = sortKpisByOrder(shuffled, COORDINATOR_KPI_ORDER);
    expect(sorted.map((kpi) => kpi.key)).toEqual([...COORDINATOR_KPI_ORDER]);
  });

  it('sorts KPIs by canonical order regardless of input order', () => {
    const shuffled = [...ALL_IMPACT_KPI_KEYS].reverse().map((key) => makeKpi(key));
    const sorted = sortKpisByCanonicalOrder(shuffled);
    expect(sorted.map((kpi) => kpi.key)).toEqual([...ALL_IMPACT_KPI_KEYS]);
  });

  it('filters hidden KPIs while preserving canonical order', () => {
    const all = ALL_IMPACT_KPI_KEYS.map((key) => makeKpi(key));
    const sorted = sortKpisByCanonicalOrder(all);
    const visible = filterKpisByVisibleKeys(sorted, [
      ...ALL_IMPACT_KPI_KEYS.filter((key) => key !== 'volunteer_growth_rate'),
    ]);
    expect(visible).toHaveLength(11);
    expect(visible.map((kpi) => kpi.key)).not.toContain('volunteer_growth_rate');
  });

  it('builds trends map from trends endpoint shape', () => {
    const map = buildTrendsMap([
      { kpi: 'volunteer_hours_total', current: { direction: 'up', percentChange: 12.5 } },
      { kpi: 'coverage_rate', current: null },
    ]);
    expect(map['volunteer_hours_total']).toEqual({ direction: 'up', percentChange: 12.5 });
    expect(map['coverage_rate']).toBeUndefined();
  });

  it('admin and public views derive identical order from shared helpers (parity)', () => {
    const input = [...ALL_IMPACT_KPI_KEYS].reverse().map((key) => makeKpi(key));
    const forPublic = filterKpisByVisibleKeys(sortKpisByCanonicalOrder(input), [...ALL_IMPACT_KPI_KEYS]);
    const forAdmin = filterKpisByVisibleKeys(sortKpisByCanonicalOrder(input), [...ALL_IMPACT_KPI_KEYS]);
    expect(forAdmin.map((kpi) => kpi.key)).toEqual(forPublic.map((kpi) => kpi.key));
  });
});

describe('ImpactKpiGrid rendering', () => {
  it('renders cards with estimate badge and trend badges', () => {
    const kpis = PUBLIC_KPI_ORDER.map((key) => makeKpi(key));
    render(
      <TestProviders>
        <ImpactKpiGrid
          kpis={sortKpisByOrder(kpis, PUBLIC_KPI_ORDER)}
          trendsByKpi={{
            volunteer_hours_total: { direction: 'up', percentChange: 12.5 },
            coverage_rate: { direction: 'stable', percentChange: 0.2 },
          }}
        />
      </TestProviders>,
    );

    expect(screen.getByText('Horas de voluntariado')).toBeInTheDocument();
    expect(screen.getByText('Tasa de baja del voluntariado')).toBeInTheDocument();
    expect(screen.getByText('Tasa de cobertura del voluntariado')).toBeInTheDocument();
    expect(screen.getByText('Tiempo de cobertura')).toBeInTheDocument();
    expect(screen.getAllByText('Estimado').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('trend-up')).toBeInTheDocument();
    expect(screen.getByLabelText('trend-stable')).toBeInTheDocument();
  });

  it('shows empty state when no KPIs exist', () => {
    render(
      <TestProviders>
        <ImpactKpiGrid kpis={[]} />
      </TestProviders>,
    );
    expect(screen.getByText('No hay datos de impacto disponibles.')).toBeInTheDocument();
  });

  it('shows error with retry action', () => {
    const onRetry = jest.fn();
    render(
      <TestProviders>
        <ImpactKpiGrid kpis={null} error="Failed to load" onRetry={onRetry} />
      </TestProviders>,
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    screen.getByText('Reintentar').click();
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('ImpactKpiGrid i18n', () => {
  it('renders English labels when locale messages are English', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImpactKpiGrid
          kpis={sortKpisByOrder(
            [makeKpi('volunteer_hours_total'), makeKpi('coverage_rate')],
            PUBLIC_KPI_ORDER,
          )}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Volunteer hours')).toBeInTheDocument();
    expect(screen.getByText('Volunteer Coverage Rate')).toBeInTheDocument();
    expect(screen.queryByText('Horas de voluntariado')).not.toBeInTheDocument();
  });

  it('shows translated explanations on info affordances when enabled', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImpactKpiGrid
          kpis={[makeKpi('coverage_rate'), makeKpi('social_impact_per_hour', 4, 'people/hour')]}
          showExplanations
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByLabelText('The percentage of volunteer slots filled out of all slots needed.'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('The number of people served for every hour volunteers contribute.'),
    ).toBeInTheDocument();
  });

  it('hides explanations when disabled', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImpactKpiGrid kpis={[makeKpi('coverage_rate')]} />
      </NextIntlClientProvider>,
    );
    expect(
      screen.queryByLabelText('The percentage of volunteer slots filled out of all slots needed.'),
    ).not.toBeInTheDocument();
  });

  it('renders an empty note for expected keys missing from the response (NPS)', () => {
    const present = COORDINATOR_KPI_ORDER.filter((key) => key !== 'volunteer_nps').map((key) =>
      makeKpi(key),
    );
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ImpactKpiGrid
          kpis={sortKpisByOrder(present, COORDINATOR_KPI_ORDER)}
          showExplanations
          expectedKeys={COORDINATOR_KPI_ORDER}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Volunteer Satisfaction (NPS)')).toBeInTheDocument();
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });
});
