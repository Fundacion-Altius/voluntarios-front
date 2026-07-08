'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  data: { month: string; count: number }[];
}

export function ContractsByMonthChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Contratos por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
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
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--chart-1))" }}
              name="Contratos"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
