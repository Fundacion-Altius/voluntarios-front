"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformApi } from "@/lib/platform/api";
import type { PlatformTenant, TenantSettings } from "@/types/platform";
import { TenantActions } from "./components/TenantActions";
import { TenantForm } from "./components/TenantForm";
import { TenantSettingsForm } from "./components/TenantSettingsForm";

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    platformApi
      .getTenant(id)
      .then((r) => {
        setTenant(r.tenant);
        setSettings(r.settings);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load tenant"));
  }, [id]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!tenant) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <StatusBadge status={tenant.status} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantForm tenant={tenant} onSaved={setTenant} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantSettingsForm tenantId={tenant.id} settings={settings} onSaved={setSettings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantActions tenant={tenant} onChanged={setTenant} />
        </CardContent>
      </Card>
    </div>
  );
}
