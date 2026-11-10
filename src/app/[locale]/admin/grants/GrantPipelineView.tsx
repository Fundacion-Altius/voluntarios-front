'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Edit, Trash2, Clock, Calendar, Euro, Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Grant } from '@/types/grant';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/grant';

interface GrantPipelineViewProps {
  grants: Grant[];
  isLoading: boolean;
  error?: string | null;
  onRefresh: () => void;
}

// Status order for pipeline columns
const STATUS_ORDER = [
  { key: 'identified', label: 'Identificado', color: 'bg-blue-100 text-blue-800' },
  { key: 'applied', label: 'Solicitado', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'approved', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { key: 'received', label: 'Recibido', color: 'bg-purple-100 text-purple-800' },
  { key: 'justified', label: 'Justificado', color: 'bg-gray-100 text-gray-800' },
  { key: 'rejected', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
];

export function GrantPipelineView({ grants, isLoading, error, onRefresh }: GrantPipelineViewProps) {
  const t = useTranslations('admin.grantsPage');
  const tCommon = useTranslations('common');

  // Group grants by status
  const grantsByStatus = useMemo(() => {
    const grouped: Record<string, Grant[]> = {};
    STATUS_ORDER.forEach(status => {
      grouped[status.key] = grants.filter(g => g.status === status.key);
    });
    return grouped;
  }, [grants]);

  // Count grants in each status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_ORDER.forEach(status => {
      counts[status.key] = grantsByStatus[status.key].length;
    });
    return counts;
  }, [grantsByStatus]);

  // Total count
  const totalCount = useMemo(() => {
    return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  }, [statusCounts]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="-mx-4 overflow-x-auto overscroll-x-contain pb-2 lg:-mx-0">
        <div className="flex w-max min-w-full gap-3 px-4 lg:px-0">
        {STATUS_ORDER.map(status => (
          <Card key={status.key} className="flex w-72 shrink-0 flex-col">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('pipelineView')}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{totalCount} {t('totalGrants')}</Badge>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="-mx-4 overflow-x-auto overscroll-x-contain pb-2 lg:-mx-0">
        <div className="flex w-max min-w-full snap-x snap-mandatory gap-3 px-4 lg:px-0">
        {STATUS_ORDER.map(status => {
          const columnGrants = grantsByStatus[status.key];
          const count = statusCounts[status.key];
          const totalAmount = columnGrants.reduce((sum, g) => sum + g.amount, 0);

          return (
            <Card key={status.key} className="flex h-full w-72 shrink-0 snap-start flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {status.label}
                    <Badge className={status.color}>
                      {count}
                    </Badge>
                  </span>
                </CardTitle>
                {count > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(totalAmount)}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto max-h-96">
                {columnGrants.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">{t('noGrantsInStatus', { status: status.label })}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columnGrants
                      .sort((a, b) => {
                        // Sort by deadline (soonest first), then by created date
                        const aDeadline = a.deadline || a.created_at;
                        const bDeadline = b.deadline || b.created_at;
                        return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
                      })
                      .map(grant => (
                        <Card 
                          key={grant.id} 
                          className="p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-sm line-clamp-1">{grant.name}</h3>
                                <p className="text-xs text-muted-foreground">{grant.funding_body}</p>
                              </div>
                              <Badge className={STATUS_COLORS[grant.status]}>
                                {STATUS_LABELS[grant.status]}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Euro className="h-3 w-3" />
                                  <span>{formatCurrency(grant.amount)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(grant.deadline)}</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-1">
                                <Link href={`/admin/grants/${grant.id}`}>
                                  <Button variant="ghost" size="icon-xs" className="h-6 w-6">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </Link>
                                <Link href={`/admin/grants/${grant.id}/edit`}>
                                  <Button variant="ghost" size="icon-xs" className="h-6 w-6">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Empty state */}
      {totalCount === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">{t('noGrantsYet')}</h3>
            <p className="text-muted-foreground mb-4">{t('noGrantsDescription')}</p>
            <Link href="/admin/grants/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createFirstGrant')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}