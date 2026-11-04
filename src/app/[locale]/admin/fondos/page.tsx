'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fundOpportunityApi, type CallSyncResult, type FundOpportunity } from '@/lib/api/fundOpportunityApi';
import { Link } from '@/i18n/navigation';
import { Search, Filter, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  EU: 'EU',
  public: 'Público',
  private: 'Privado',
  CSR: 'RSE',
};

const TYPE_COLORS: Record<string, string> = {
  EU: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  public: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  private: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  CSR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const SCOPE_SUGGESTIONS = ['Europeo', 'Estatal', 'Autonómico', 'Local'];

export default function FondosPage() {
  const t = useTranslations('admin.fondos');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<FundOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [deadlineFrom, setDeadlineFrom] = useState<string>('');
  const [deadlineTo, setDeadlineTo] = useState<string>('');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<CallSyncResult | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fundOpportunityApi.list({
        q: search,
        type: typeFilter,
        sector: sectorFilter,
        scope: scopeFilter,
        deadlineFrom,
        deadlineTo,
        includeExpired,
      });
      if (result.success) setOpportunities(result.data);
      else setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, sectorFilter, scopeFilter, deadlineFrom, deadlineTo, includeExpired]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOpportunities();
  }, [isAuthenticated, loadOpportunities]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fundOpportunityApi
      .getSyncStatus()
      .then((result) => {
        if (!result.success) return;
        setLastSyncAt(result.data.lastRunAt);
        if (result.data.lastResult?.warning) setSyncWarning(result.data.lastResult.warning);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const result = await fundOpportunityApi.sync();
      if (result.success) {
        setSyncResult(result.data);
        setSyncWarning(result.data.warning ?? null);
        setLastSyncAt(new Date().toISOString());
        await loadOpportunities();
      } else {
        setError(result.error || t('errorSincronizar'));
      }
    } catch {
      setError(t('errorSincronizar'));
    } finally {
      setIsSyncing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t('sincronizando') : t('sincronizar')}
          </Button>
          <Link href="/admin/fondos/calendario">
            <Button variant="outline">{t('calendario')}</Button>
          </Link>
          <Link href="/admin/fondos/alertas">
            <Button variant="outline">{t('alertas')}</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {syncWarning && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md bg-amber-100 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {t('avisoSincronizacion')}: {syncWarning}
          </span>
        </div>
      )}

      {syncResult && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {t('sincronizacionCompletada', {
            imported: syncResult.imported,
            skipped: syncResult.skipped,
            expired: syncResult.expired,
          })}
        </div>
      )}

      {lastSyncAt && !syncResult && (
        <p className="mb-4 text-xs text-muted-foreground">
          {t('ultimaSincronizacion')}: {new Date(lastSyncAt).toLocaleString('es-ES')}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t('buscarPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          {(['EU', 'public', 'private', 'CSR'] as const).map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="xs"
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
            >
              {TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
        <Input
          placeholder={t('sectorPlaceholder')}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          list="fondos-scope-options"
          placeholder={t('ambitoPlaceholder')}
          aria-label={t('ambito')}
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="max-w-xs"
        />
        <datalist id="fondos-scope-options">
          {SCOPE_SUGGESTIONS.map((scope) => (
            <option key={scope} value={scope} />
          ))}
        </datalist>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('plazoDesde')}
          <Input
            type="date"
            value={deadlineFrom}
            max={deadlineTo || undefined}
            onChange={(e) => setDeadlineFrom(e.target.value)}
            className="w-40"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('plazoHasta')}
          <Input
            type="date"
            value={deadlineTo}
            min={deadlineFrom || undefined}
            onChange={(e) => setDeadlineTo(e.target.value)}
            className="w-40"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
          />
          {t('incluirCaducadas')}
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          {t('sinResultados')}
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <Card key={opp.id} className={opp.outdated ? 'border-amber-300 dark:border-amber-700' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{opp.name}</CardTitle>
                      <Badge className={TYPE_COLORS[opp.type] || ''}>
                        {TYPE_LABELS[opp.type] || opp.type}
                      </Badge>
                      {opp.scope && <Badge variant="secondary">{opp.scope}</Badge>}
                      {opp.listing_status === 'expired' && (
                        <Badge variant="outline">{t('caducada')}</Badge>
                      )}
                      {opp.outdated && (
                        <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="size-3" />
                          {t('desactualizada')}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">{opp.funding_body}</CardDescription>
                  </div>
                  <Link href={`/admin/fondos/${opp.id}`}>
                    <Button size="sm">{t('verDetalle')}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {opp.amount_min && opp.amount_max && (
                    <span>{t('cantidad')}: {opp.amount_min.toLocaleString()}€ - {opp.amount_max.toLocaleString()}€</span>
                  )}
                  {opp.deadline && (
                    <span>{t('fechaLimite')}: {opp.deadline}</span>
                  )}
                  <span>{t('sectores')}: {opp.sector_tags}</span>
                </div>
                {opp.application_url && (
                  <a
                    href={opp.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    {t('enlaceAplicacion')}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
