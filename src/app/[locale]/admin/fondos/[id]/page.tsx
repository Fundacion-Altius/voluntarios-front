'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, AlertTriangle, ExternalLink, FileText } from 'lucide-react';

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

export default function FondoDetallePage() {
  const t = useTranslations('admin.fondos');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [opportunity, setOpportunity] = useState<FundOpportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (id === 'grants') {
      router.replace('/admin/grants');
      return;
    }
    if (!isAuthenticated || !id) return;
    setIsLoading(true);
    setError(null);
    apiClient<FundOpportunity>(apiUrl(`/api/fund-opportunities/${id}`))
      .then((result) => {
        if (result.success) setOpportunity(result.data);
        else setError(result.error);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, id, router]);

  if (id === 'grants') {
    return null;
  }

  const handleApply = async () => {
    if (!id) return;
    try {
      await apiClient(apiUrl(`/api/fund-opportunities/${id}/apply`), { method: 'POST' });
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch {
      setError(t('errorAplicar'));
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div>
        <Link href="/admin/fondos" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="size-4" />
          {t('volverLista')}
        </Link>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!opportunity) return null;

  return (
    <div>
      <Link href="/admin/fondos" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" />
        {t('volverLista')}
      </Link>

      {applySuccess && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {t('solicitudCreada')}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{opportunity.name}</CardTitle>
                <Badge className={TYPE_COLORS[opportunity.type] || ''}>
                  {TYPE_LABELS[opportunity.type] || opportunity.type}
                </Badge>
                {opportunity.outdated && (
                  <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3" />
                    {t('desactualizada')}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">{opportunity.funding_body}</p>
            </div>
            <Button onClick={handleApply}>
              <FileText className="size-4" />
              {t('iniciarSolicitud')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunity.description && (
            <div>
              <h4 className="mb-1 text-sm font-medium">{t('descripcion')}</h4>
              <p className="text-sm text-muted-foreground">{opportunity.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {opportunity.amount_min && opportunity.amount_max && (
              <div>
                <h4 className="mb-1 text-sm font-medium">{t('cantidad')}</h4>
                <p className="text-sm text-muted-foreground">
                  {opportunity.amount_min.toLocaleString()}€ - {opportunity.amount_max.toLocaleString()}€
                </p>
              </div>
            )}
            {opportunity.deadline && (
              <div>
                <h4 className="mb-1 text-sm font-medium">{t('fechaLimite')}</h4>
                <p className="text-sm text-muted-foreground">{opportunity.deadline}</p>
              </div>
            )}
            <div>
              <h4 className="mb-1 text-sm font-medium">{t('sectores')}</h4>
              <p className="text-sm text-muted-foreground">{opportunity.sector_tags}</p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">{t('ultimaActualizacion')}</h4>
              <p className="text-sm text-muted-foreground">{opportunity.last_updated}</p>
            </div>
          </div>

          {opportunity.eligibility_criteria && (
            <div>
              <h4 className="mb-1 text-sm font-medium">{t('criteriosElegibilidad')}</h4>
              <p className="text-sm text-muted-foreground">{opportunity.eligibility_criteria}</p>
            </div>
          )}

          {opportunity.application_url && (
            <a
              href={opportunity.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              {t('enlaceAplicacion')}
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
