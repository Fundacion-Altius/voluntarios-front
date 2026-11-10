'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Grant, GrantStatus, GrantType, GrantFilters, GrantPipelineStats, FundingDiversification } from '@/types/grant';
import { grantApi } from '@/lib/api/grantApi';

export const useGrants = () => {
  const t = useTranslations('admin.grantsPage');
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GrantFilters>({});
  const [pipelineStats, setPipelineStats] = useState<GrantPipelineStats | null>(null);
  const [fundingDiversification, setFundingDiversification] = useState<FundingDiversification | null>(null);

  // Fetch all grants
  const fetchGrants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await grantApi.getAll(filters);
      
      if (response.success && response.data) {
        setGrants(response.data);
      } else {
        setError(response.error || t('errorLoadingGrants'));
        setGrants([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoadingGrants'));
      setGrants([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  // Fetch pipeline statistics
  const fetchPipelineStats = useCallback(async () => {
    try {
      const response = await grantApi.getPipelineStats();
      
      if (response.success && response.data) {
        setPipelineStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching pipeline stats:', err);
    }
  }, []);

  // Fetch funding diversification
  const fetchFundingDiversification = useCallback(async () => {
    try {
      const response = await grantApi.getFundingDiversification();
      
      if (response.success && response.data) {
        setFundingDiversification(response.data);
      }
    } catch (err) {
      console.error('Error fetching funding diversification:', err);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchGrants(),
      fetchPipelineStats(),
      fetchFundingDiversification(),
    ]);
  }, [fetchGrants, fetchPipelineStats, fetchFundingDiversification]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch when filters change
  useEffect(() => {
    fetchGrants();
  }, [filters, fetchGrants]);

  // Update filters
  const updateFilters = useCallback((newFilters: GrantFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get grants by status (for pipeline view)
  const getGrantsByStatus = useCallback((status: GrantStatus) => {
    return grants.filter(grant => grant.status === status);
  }, [grants]);

  // Get grants by type
  const getGrantsByType = useCallback((type: GrantType) => {
    return grants.filter(grant => grant.type === type);
  }, [grants]);

  // Get total pipeline value
  const getTotalPipelineValue = useCallback(() => {
    return grants
      .filter(grant => grant.status === 'applied' || grant.status === 'approved')
      .reduce((sum, grant) => sum + grant.amount, 0);
  }, [grants]);

  // Get approval rate
  const getApprovalRate = useCallback(() => {
    const decidedGrants = grants.filter(grant => grant.status === 'approved' || grant.status === 'rejected');
    if (decidedGrants.length === 0) return 0;
    
    const approvedGrants = decidedGrants.filter(grant => grant.status === 'approved');
    return (approvedGrants.length / decidedGrants.length) * 100;
  }, [grants]);

  return {
    grants,
    isLoading,
    error,
    filters,
    pipelineStats,
    fundingDiversification,
    fetchGrants,
    fetchAllData,
    updateFilters,
    clearFilters,
    getGrantsByStatus,
    getGrantsByType,
    getTotalPipelineValue,
    getApprovalRate,
  };
};

export default useGrants;