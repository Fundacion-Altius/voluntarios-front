'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Bell, BellRing } from 'lucide-react';

interface AlertConfig {
  sectors: string[];
  minScore: number;
  frequency: 'immediate' | 'daily' | 'weekly';
}

const SECTOR_OPTIONS = [
  'educación', 'juventud', 'inclusión', 'social', 'cultura', 'deporte',
  'medio ambiente', 'salud', 'empleo', 'cooperación', 'derechos', 'discapacidad',
];

const FREQUENCY_LABELS: Record<string, string> = {
  immediate: 'Inmediata',
  daily: 'Diaria',
  weekly: 'Semanal',
};

export default function FondosAlertasPage() {
  const t = useTranslations('admin.fondos');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(30);
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate');

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    Promise.all([
      apiClient<AlertConfig | null>(apiUrl('/api/fund-opportunities/alerts/config')),
      apiClient<any[]>(apiUrl('/api/fund-opportunities/alerts/pending')),
    ])
      .then(([cfgResult, pendingResult]) => {
        const cfg = cfgResult.success ? cfgResult.data : null;
        const pending = pendingResult.success ? pendingResult.data : [];
        setConfig(cfg);
        setPendingAlerts(pending);
        if (cfg) {
          setSelectedSectors(cfg.sectors);
          setMinScore(cfg.minScore);
          setFrequency(cfg.frequency);
        }
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const handleSave = async () => {
    try {
      await apiClient(apiUrl('/api/fund-opportunities/alerts/config'), {
        method: 'POST',
        body: JSON.stringify({ sectors: selectedSectors, minScore, frequency }),
      });
      setSuccessMsg(t('configGuardada'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setError(t('errorGuardar'));
    }
  };

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector],
    );
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <Link href="/admin/fondos" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" />
        {t('volverLista')}
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <Bell className="size-5" />
        <h2 className="text-xl font-semibold">{t('alertasTitulo')}</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('configurarAlertas')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">{t('sectoresInteres')}</h4>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_OPTIONS.map((sector) => (
                    <Button
                      key={sector}
                      variant={selectedSectors.includes(sector) ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => toggleSector(sector)}
                    >
                      {sector}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">{t('puntuacionMinima')}</h4>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="max-w-xs"
                />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">{t('frecuencia')}</h4>
                <div className="flex gap-2">
                  {(['immediate', 'daily', 'weekly'] as const).map((freq) => (
                    <Button
                      key={freq}
                      variant={frequency === freq ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFrequency(freq)}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave}>{t('guardarConfig')}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-4" />
                {t('alertasPendientes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('sinAlertas')}</p>
              ) : (
                <div className="space-y-2">
                  {pendingAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{alert.name}</p>
                        <p className="text-xs text-muted-foreground">{alert.funding_body}</p>
                      </div>
                      <Badge variant="outline">{alert.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
