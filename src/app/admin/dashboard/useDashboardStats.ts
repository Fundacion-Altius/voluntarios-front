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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [session]);

  return { stats, isLoading, error };
}
