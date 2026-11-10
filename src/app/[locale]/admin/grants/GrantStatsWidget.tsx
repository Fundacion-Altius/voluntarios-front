'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Euro, TrendingUp, TrendingDown, PieChart, Calendar, CheckCircle } from 'lucide-react';
import type { Grant, GrantPipelineStats, FundingDiversification } from '@/types/grant';

interface GrantStatsWidgetProps {
  pipelineStats?: GrantPipelineStats | null;
  fundingDiversification?: FundingDiversification | null;
  grants: Grant[];
}

export function GrantStatsWidget({ 
  pipelineStats, 
  fundingDiversification, 
  grants 
}: GrantStatsWidgetProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate stats from grants if pipelineStats is not available
  const totalGrants = pipelineStats?.total || grants.length;
  const totalPipelineValue = pipelineStats?.totalPipelineValue || 
    grants.filter(g => g.status === 'applied' || g.status === 'approved')
          .reduce((sum, g) => sum + g.amount, 0);
  const approvalRate = pipelineStats?.approvalRate || 0;
  
  // Calculate funding diversification from grants if not available from API
  const calcFundingDiversification = () => {
    if (fundingDiversification) {
      return fundingDiversification;
    }
    
    const counts = { public: 0, private: 0, EU: 0 };
    grants.forEach(g => counts[g.type]++);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    return total > 0 ? {
      public: Math.round((counts.public / total) * 100),
      private: Math.round((counts.private / total) * 100),
      EU: Math.round((counts.EU / total) * 100),
    } : { public: 0, private: 0, EU: 0 };
  };

  const diversification = calcFundingDiversification();
  const formatPercent = (value: number) => `${Number(value).toFixed(2)}%`;

  // Get upcoming deadlines (next 30 days)
  const upcomingDeadlines = grants
    .filter(g => g.deadline)
    .filter(g => {
      const deadline = new Date(g.deadline!);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return deadline >= now && deadline <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Grants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subvenciones</CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <PieChart className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGrants}</div>
          <p className="text-xs text-muted-foreground">
            {totalGrants > 0 
              ? `${grants.filter((g) => g.status === 'applied' || g.status === 'approved').length} en proceso`
              : 'No hay subvenciones'}
          </p>
        </CardContent>
      </Card>

      {/* Pipeline Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Pipeline</CardTitle>
          <div className="p-2 bg-green-100 rounded-full">
            <Euro className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
          <p className="text-xs text-muted-foreground">
            en estado aplicado o aprobado
          </p>
        </CardContent>
      </Card>

      {/* Approval Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
          <div className="p-2 bg-purple-100 rounded-full">
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvalRate.toFixed(0)}%</div>
          <Progress value={approvalRate} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {approvalRate > 0 ? 'Buen rendimiento' : 'No hay datos'}
          </p>
        </CardContent>
      </Card>

      {/* Funding Diversification */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Diversificación</CardTitle>
          <div className="p-2 bg-orange-100 rounded-full">
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Pública</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${diversification.public}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums">{formatPercent(diversification.public)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Privada</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${diversification.private}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums">{formatPercent(diversification.private)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>UE</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ width: `${diversification.EU}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums">{formatPercent(diversification.EU)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Próximos Plazos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map(grant => {
                const deadline = new Date(grant.deadline || '');
                const now = new Date();
                const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                
                return (
                  <div key={grant.id} className="flex min-w-0 flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{grant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{grant.funding_body}</p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(grant.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {deadline.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant={daysUntil <= 7 ? 'destructive' : 'secondary'}>
                        {daysUntil} días
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}