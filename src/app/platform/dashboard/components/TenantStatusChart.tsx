"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TenantStatus } from "@/types/platform";

export function TenantStatusChart({ counts }: { counts: Record<TenantStatus, number> }) {
  const data = (Object.keys(counts) as TenantStatus[]).map((status) => ({
    status,
    count: counts[status],
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="status" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
