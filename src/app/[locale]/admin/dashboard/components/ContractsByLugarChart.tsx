'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltipContent } from './ChartTooltipContent';

interface Props {
  data: { lugar: string; count: number }[];
}

export function ContractsByLugarChart({ data }: Props) {
  const t = useTranslations('admin.dashboard');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('signupsByLugar')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="lugar"
              tick={{ fontSize: 12 }}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              allowDecimals={false}
              className="text-muted-foreground"
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              name={t('signupsSeries')}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
