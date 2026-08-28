'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartTooltipContent } from './ChartTooltipContent';

interface ImpactChartDataPoint {
  period: string;
  value: number;
  kpi: string;
}

interface ImpactTrendResult {
  kpi: string;
  current: {
    key: string;
    currentValue: number;
    comparisonValue: number;
    percentChange: number;
    direction: 'up' | 'down' | 'stable';
    windowMonths: number;
  } | null;
  history: ImpactChartDataPoint[];
}

interface Props {
  data: ImpactTrendResult[];
  isLoading?: boolean;
}

const KPI_COLORS: Record<string, string> = {
  volunteer_hours_total: 'var(--chart-1)',
  people_served_estimated: 'var(--chart-2)',
  volunteer_retention_rate: 'var(--chart-3)',
  community_satisfaction: 'var(--chart-4)',
  volunteer_growth_rate: 'var(--chart-5)',
};

const KPI_LABELS: Record<string, string> = {
  volunteer_hours_total: 'Horas de voluntariado',
  people_served_estimated: 'Personas atendidas',
  volunteer_retention_rate: 'Retención de voluntarios',
  community_satisfaction: 'Satisfacción',
  volunteer_growth_rate: 'Crecimiento de voluntarios',
};

function TrendIndicator({ trend }: { trend: ImpactTrendResult['current'] }) {
  if (!trend) return null;

  const colorClass =
    trend.direction === 'up'
      ? 'text-green-600'
      : trend.direction === 'down'
        ? 'text-red-600'
        : 'text-gray-500';

  const symbol =
    trend.direction === 'up'
      ? '↑'
      : trend.direction === 'down'
        ? '↓'
        : '→';

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <span>{symbol}</span>
      <span>{trend.percentChange.toFixed(1)}%</span>
    </div>
  );
}

export function ImpactTrendsChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tendencias de Impacto</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tendencias de Impacto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay datos de tendencias disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - combine all KPI histories
  const chartData: Record<string, { [kpi: string]: number }> = {};

  data.forEach((trend) => {
    trend.history.forEach((point) => {
      if (!chartData[point.period]) {
        chartData[point.period] = {};
      }
      chartData[point.period][trend.kpi] = point.value;
    });
  });

  const chartArray = Object.entries(chartData).map(([period, values]) => ({
    period,
    ...values,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tendencias de Impacto</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Trend summary */}
        <div className="flex flex-wrap gap-4 mb-4">
          {data.map((trend) => (
            <div
              key={trend.kpi}
              className="flex items-center gap-2 text-sm"
            >
              <span className="font-medium">{KPI_LABELS[trend.kpi] || trend.kpi}:</span>
              <TrendIndicator trend={trend.current} />
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartArray}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                className="text-muted-foreground"
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {data.map((trend) => (
                <Line
                  key={trend.kpi}
                  type="monotone"
                  dataKey={trend.kpi}
                  stroke={KPI_COLORS[trend.kpi] || 'var(--chart-1)'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={KPI_LABELS[trend.kpi] || trend.kpi}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
