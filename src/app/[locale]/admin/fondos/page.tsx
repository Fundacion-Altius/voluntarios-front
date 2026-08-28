'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { Link } from '@/i18n/navigation';
import { Search, Filter, AlertTriangle, ExternalLink } from 'lucide-react';

interface FundOpportunity {
  id: string;
  name: string;
  funding_body: string;
  type: string;
  sector_tags: string;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  eligibility_criteria: string | null;
  application_url: string | null;
  description: string | null;
  last_updated: string;
  created_at: string;
  outdated?: boolean;
}

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

export default function FondosPage() {
  const t = useTranslations('admin.fondos');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<FundOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (typeFilter) params.set('type', typeFilter);
    if (sectorFilter) params.set('sector', sectorFilter);

    apiClient<FundOpportunity[]>(apiUrl(`/api/fund-opportunities?${params.toString()}`))
      .then(setOpportunities)
      .catch((e: any) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, search, typeFilter, sectorFilter]);

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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <div className="flex gap-2">
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{opp.name}</CardTitle>
                      <Badge className={TYPE_COLORS[opp.type] || ''}>
                        {TYPE_LABELS[opp.type] || opp.type}
                      </Badge>
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
