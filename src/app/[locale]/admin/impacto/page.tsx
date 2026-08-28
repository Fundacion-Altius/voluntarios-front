'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

import { ALL_IMPACT_KPI_KEYS } from '@/modules/impact/types';

type ImpactConfig = {
  organizationName: string;
  organizationLogo: string;
  enabledKpis: readonly string[];
  showEstimateBadge: boolean;
  peoplePerHourFactor: number;
};

const KPI_LABELS: Record<string, string> = {
  volunteer_hours_total: 'Horas de voluntariado',
  people_served_estimated: 'Personas atendidas (estimado)',
  volunteer_retention_rate: 'Tasa de retención de voluntarios',
  community_satisfaction: 'Satisfacción de la comunidad',
  volunteer_growth_rate: 'Crecimiento de voluntarios',
};

const DEFAULT_CONFIG: ImpactConfig = {
  organizationName: 'Fundación Altius',
  organizationLogo: '/logo.png',
  enabledKpis: ALL_IMPACT_KPI_KEYS,
  showEstimateBadge: true,
  peoplePerHourFactor: 4,
};

export default function AdminImpactConfigPage() {
  const t = useTranslations('admin.impact');
  const [config, setConfig] = useState<ImpactConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Load configuration from localStorage or use defaults
    const savedConfig = localStorage.getItem('impactConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch {
        setConfig(DEFAULT_CONFIG);
      }
    } else {
      setConfig(DEFAULT_CONFIG);
    }
    setLoading(false);
  }, []);

  const handleSave = () => {
    if (!config) return;

    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('impactConfig', JSON.stringify(config));
      setAlertMessage({ type: 'success', message: t('configSaved') });
    } catch (error) {
      setAlertMessage({ type: 'error', message: t('configSaveError') });
    } finally {
      setSaving(false);
      // Clear alert after 5 seconds
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const toggleKpi = (kpiKey: string) => {
    if (!config) return;
    const newEnabledKpis = config.enabledKpis.includes(kpiKey)
      ? config.enabledKpis.filter((k) => k !== kpiKey)
      : [...config.enabledKpis, kpiKey];
    setConfig({
      ...config,
      enabledKpis: newEnabledKpis,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!config) {
    return <div>{t('loadingError')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {alertMessage && (
        <div
          className={`p-4 rounded-md ${alertMessage.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}
        >
          {alertMessage.message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('organizationSettings')}</CardTitle>
            <CardDescription>{t('organizationSettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">{t('organizationName')}</Label>
              <Input
                id="organizationName"
                value={config.organizationName}
                onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationLogo">{t('organizationLogo')}</Label>
              <Input
                id="organizationLogo"
                value={config.organizationLogo}
                onChange={(e) => setConfig({ ...config, organizationLogo: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('displaySettings')}</CardTitle>
            <CardDescription>{t('displaySettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="peoplePerHour">{t('peoplePerHourFactor')}</Label>
              <Input
                id="peoplePerHour"
                type="number"
                value={config.peoplePerHourFactor}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    peoplePerHourFactor: parseFloat(e.target.value) || 0,
                  })
                }
                min="0"
                max="1000"
                step="0.1"
              />
              <p className="text-sm text-muted-foreground">
                {t('peoplePerHourHint')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showEstimateBadge"
                checked={config.showEstimateBadge}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, showEstimateBadge: checked as boolean })
                }
              />
              <Label htmlFor="showEstimateBadge" className="cursor-pointer">
                {t('showEstimateBadge')}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('kpiSelection')}</CardTitle>
          <CardDescription>{t('kpiSelectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {ALL_IMPACT_KPI_KEYS.map((kpiKey) => (
              <div
                key={kpiKey}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  id={`kpi-${kpiKey}`}
                  checked={config.enabledKpis.includes(kpiKey)}
                  onCheckedChange={() => toggleKpi(kpiKey)}
                />
                <Label htmlFor={`kpi-${kpiKey}`} className="flex-1 cursor-pointer">
                  {KPI_LABELS[kpiKey] || kpiKey}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleReset} variant="outline" disabled={saving}>
          {t('reset')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('save')}
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('preview')}</CardTitle>
          <CardDescription>{t('previewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{config.organizationName}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('previewSubtitle', { count: config.enabledKpis.length })}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.enabledKpis.map((kpiKey) => (
                <span
                  key={kpiKey}
                  className="px-3 py-1 bg-secondary rounded-full text-sm"
                >
                  {KPI_LABELS[kpiKey] || kpiKey}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
