"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { platformApi } from "@/lib/platform/api";
import type { TenantSettings } from "@/types/platform";

const FLAG_KEYS = ["chatbot_enabled", "surveys_enabled", "video_enabled", "analytics_enabled"];

export function TenantSettingsForm({
  tenantId,
  settings,
  onSaved,
}: {
  tenantId: string;
  settings: TenantSettings | null;
  onSaved: (s: TenantSettings) => void;
}) {
  const [displayName, setDisplayName] = useState(settings?.chatbot_display_name ?? "");
  const [flags, setFlags] = useState<Record<string, boolean>>(settings?.feature_flags ?? {});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { settings: updated } = await platformApi.updateSettings(tenantId, {
        chatbot_display_name: displayName || null,
        feature_flags: flags,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="chatbot-name">Chatbot display name</Label>
        <Input id="chatbot-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Feature flags</legend>
        {FLAG_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!flags[key]}
              onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
            />
            {key}
          </label>
        ))}
      </fieldset>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
