'use client';

import type { TooltipProps } from 'recharts';

type ValueType = string | number | Array<string | number>;

export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipProps<ValueType, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      {label && (
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      )}
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="text-sm font-semibold text-foreground">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}
