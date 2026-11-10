'use client';

import { useAuthGate } from '@/app/auth/useAuthGate';
import { ImpactRedesignApp } from '@/modules/impact/components/ImpactRedesignApp';
import { useImpactKpis, currentMonthPeriod } from '@/modules/impact/hooks/useImpactKpis';
import { useImpactTenantConfig } from '@/modules/impact/hooks/useImpactTenantConfig';

export default function AdminImpactConfigPage() {
  const { user } = useAuthGate();
  const role = (user as { role?: string } | null)?.role;
  const canEdit = role === 'admin';
  const period = currentMonthPeriod();

  const { config, catalog, loading, error, saving, saveConfig, setManualValue } =
    useImpactTenantConfig({ enabled: role === 'admin' || role === 'nave' });

  const { kpis } = useImpactKpis({
    enabled: role === 'admin' || role === 'nave',
    period,
  });

  return (
    <ImpactRedesignApp
      config={config}
      catalog={catalog}
      kpis={kpis}
      loading={loading}
      saving={saving}
      error={error}
      canEdit={canEdit}
      onSave={saveConfig}
      onManual={setManualValue}
    />
  );
}
