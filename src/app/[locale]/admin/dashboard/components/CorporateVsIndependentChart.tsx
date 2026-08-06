'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type PieLabelRenderProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltipContent } from './ChartTooltipContent';

const COLORS = ['var(--chart-2)', 'var(--chart-5)'];

interface Props {
  corporate: number;
  independent: number;
}

export function CorporateVsIndependentChart({ corporate, independent }: Props) {
  const data = [
    { name: 'Empresarial', value: corporate },
    { name: 'Independiente', value: independent },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Empresarial vs Independiente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={(entry: PieLabelRenderProps) => `${entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
