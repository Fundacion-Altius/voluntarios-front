"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/platform/ErrorBoundary";
import { platformApi } from "@/lib/platform/api";
import type { DashboardMetrics, TenantSummary } from "@/types/platform";
import { usePlatformAuthContext } from "../auth/PlatformAuthProvider";
import { MetricsCard } from "./components/MetricsCard";
import { TenantList } from "./components/TenantList";
import { TenantStatusChart } from "./components/TenantStatusChart";

export default function PlatformDashboardPage() {
  const { isAuthenticated, loading } = usePlatformAuthContext();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/platform/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([platformApi.metrics(), platformApi.tenantList()])
      .then(([m, t]) => {
        setMetrics(m);
        setTenants(t.tenants);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"));
  }, [isAuthenticated]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!isAuthenticated) return null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {metrics && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricsCard title="Total tenants" value={metrics.total} />
            <MetricsCard title="Active" value={metrics.counts.active} />
            <MetricsCard title="Suspended" value={metrics.counts.suspended} />
            <MetricsCard title="Archived" value={metrics.counts.archived} />
          </div>
        )}
        {metrics && <TenantStatusChart counts={metrics.counts} />}
        <TenantList tenants={tenants} />
      </div>
    </ErrorBoundary>
  );
}
