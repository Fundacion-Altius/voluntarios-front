'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface MetricCardsProps {
  totalContracts: number;
  activeVolunteers: number;
  surveyCompletionRate: number;
  // Member metrics
  totalMembers?: number;
  activeMembers?: number;
  churnRate?: number;
  retentionRate?: number;
  // Grant metrics
  grantMetrics?: {
    totalGrants: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalPipelineValue: number;
    approvalRate: number;
  };
}

export function MetricCards({ 
  totalContracts, 
  activeVolunteers, 
  surveyCompletionRate,
  totalMembers,
  activeMembers,
  churnRate,
  retentionRate,
  grantMetrics
}: MetricCardsProps) {
  const t = useTranslations('admin.dashboard');
  const ratePercent = Math.round(surveyCompletionRate * 100);
  const churnPercent = churnRate !== undefined ? Math.round(churnRate * 100) : 0;
  const retentionPercent = retentionRate !== undefined ? Math.round(retentionRate * 100) : 0;
  const approvalRatePercent = grantMetrics?.approvalRate !== undefined ? Math.round(grantMetrics.approvalRate * 100) : 0;
  const totalPipelineValue = grantMetrics?.totalPipelineValue || 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('totalContracts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalContracts}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('activeVolunteers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{activeVolunteers}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('surveyCompletionRate')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{ratePercent}%</p>
        </CardContent>
      </Card>
      {totalMembers !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalMembers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMembers}</p>
          </CardContent>
        </Card>
      )}
      {activeMembers !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('activeMembers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeMembers}</p>
          </CardContent>
        </Card>
      )}
      {churnRate !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('churnRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{churnPercent}%</p>
          </CardContent>
        </Card>
      )}
      {retentionRate !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('retentionRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{retentionPercent}%</p>
          </CardContent>
        </Card>
      )}
      {grantMetrics !== undefined && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalGrants')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{grantMetrics.totalGrants}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('pipelineValue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPipelineValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('approvalRate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{approvalRatePercent}%</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
