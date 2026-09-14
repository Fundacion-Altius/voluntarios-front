"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { platformApi } from "@/lib/platform/api";
import type { PlatformTenant } from "@/types/platform";

export function TenantActions({
  tenant,
  onChanged,
}: {
  tenant: PlatformTenant;
  onChanged: (t: PlatformTenant) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "suspend" | "archive", fn: () => Promise<{ tenant: PlatformTenant }>) {
    if (!confirm(`Are you sure you want to ${action} tenant ${tenant.name}?`)) return;
    setBusy(action);
    setMessage(null);
    const pastTense = action === "suspend" ? "suspended" : "archived";
    try {
      const { tenant: updated } = await fn();
      onChanged(updated);
      setMessage(`Tenant ${pastTense} successfully`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : `Failed to ${action} tenant`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => run("suspend", () => platformApi.suspendTenant(tenant.id))}
        >
          {busy === "suspend" ? "Suspending…" : "Suspend"}
        </Button>
        <Button
          variant="destructive"
          disabled={busy !== null}
          onClick={() => run("archive", () => platformApi.archiveTenant(tenant.id))}
        >
          {busy === "archive" ? "Archiving…" : "Archive"}
        </Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
