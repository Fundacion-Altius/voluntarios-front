'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useGrants } from './useGrants';
import { STATUS_COLORS, STATUS_LABELS, type GrantStatus, type GrantType } from '@/types/grant';
import { GrantPipelineView } from './GrantPipelineView';
import { GrantStatsWidget } from './GrantStatsWidget';

export default function GrantsPage() {
  const t = useTranslations('admin.grantsPage');
  const tCommon = useTranslations('common');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const {
    grants,
    isLoading,
    error,
    filters,
    pipelineStats,
    fundingDiversification,
    fetchAllData,
    updateFilters,
    clearFilters,
    getGrantsByStatus,
  } = useGrants();

  const [searchQuery, setSearchQuery] = useState('');

  // Status order for pipeline view
  const statusOrder: GrantStatus[] = ['identified', 'applied', 'approved', 'received', 'justified', 'rejected'];

  // Filter grants by search query
  const filteredGrants = useMemo(() => {
    if (!searchQuery) return grants;
    
    return grants.filter(grant => 
      grant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.funding_body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [grants, searchQuery]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      updateFilters({ search: searchQuery });
    } else {
      clearFilters();
    }
  };

  // Handle status filter
  const handleStatusFilter = (status: GrantStatus | 'all') => {
    if (status === 'all') {
      updateFilters({ status: undefined });
    } else {
      updateFilters({ status });
    }
  };

  // Handle type filter
  const handleTypeFilter = (type: GrantType | 'all') => {
    if (type === 'all') {
      updateFilters({ type: undefined });
    } else {
      updateFilters({ type });
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>{tCommon('notAuthenticated')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('refresh')}
          </Button>
          <Link href="/admin/grants/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('newGrant')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Widget */}
      <GrantStatsWidget 
        pipelineStats={pipelineStats} 
        fundingDiversification={fundingDiversification}
        grants={grants}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filters.status || 'all'} onValueChange={(value) => handleStatusFilter(value as GrantStatus | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                {statusOrder.map(status => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => handleTypeFilter(value as GrantType | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="public">{t('public')}</SelectItem>
                <SelectItem value="private">{t('private')}</SelectItem>
                <SelectItem value="EU">{t('eu')}</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {tCommon('apply')}
            </Button>
            
            {Object.keys(filters).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {tCommon('clear')}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Pipeline View */}
      <GrantPipelineView 
        grants={filteredGrants}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchAllData}
      />

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}