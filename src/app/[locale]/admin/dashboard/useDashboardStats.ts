'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface DashboardStats {
  totalContracts: number;
  activeVolunteers: number;
  surveyCompletionRate: number;
  contractsByMonth: { month: string; count: number }[];
  contractsByLugar: { lugar: string; count: number }[];
  corporateVsIndependent: { corporate: number; independent: number };
  recentContracts: { id: string; nombre: string; empresa: string | null; fecha: string }[];
  
  // Member/Donor metrics
  totalMembers?: number;
  activeMembers?: number;
  lapsedMembers?: number;
  churnedMembers?: number;
  atRiskMembers?: number;
  totalContributions?: number;
  averageContributionAmount?: string;
  churnRate?: number;
  retentionRate?: number;
  averageLifetimeValue?: string;
  
  // Grant metrics
  grantMetrics?: {
    totalGrants: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalPipelineValue: number;
    approvalRate: number;
  };
  fundingDiversification?: Record<string, number>;
  upcomingGrantDeadlines?: { id: string; name: string; deadline: string; amount: number; type: string }[];
}

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export function useDashboardStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = (session as any)?.authToken;
    setIsLoading(true);
    setError(null);

    fetch(`${API_URL}/api/dashboard/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || errorData.error || 'Failed to fetch dashboard stats');
          setIsLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data !== null) {
          setStats(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [session]);

  return { stats, isLoading, error };
}
