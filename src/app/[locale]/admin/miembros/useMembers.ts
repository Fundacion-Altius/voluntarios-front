'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

// Member types
export type MembershipTier = 'basic' | 'premium' | 'founder';
export type MemberStatus = 'active' | 'lapsed' | 'churned';
export type ContributionFrequency = 'one-time' | 'monthly' | 'quarterly' | 'annual';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'other';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'other';

export interface ContactPreferences {
  email: boolean;
  phone: boolean;
  mail: boolean;
}

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  tier: MembershipTier;
  join_date: string;
  status: MemberStatus;
  last_contribution_date: string | null;
  contact_preferences: string | null; // JSON string
  churn_risk: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  member_id: string;
  amount: string; // decimal as string
  currency: Currency;
  frequency: ContributionFrequency;
  payment_method: PaymentMethod;
  date: string;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  lapsedMembers: number;
  churnedMembers: number;
  atRiskMembers: number;
  totalContributions: number;
  totalAmount: string;
  averageContribution: string;
}

export interface ChurnStats {
  churnRate: number;
  retentionRate: number;
  atRiskCount: number;
  recentlyLapsedCount: number;
  recentlyChurnedCount: number;
}

// Filter options
export interface MemberFilterOptions {
  status?: MemberStatus;
  tier?: MembershipTier;
  search?: string;
}

// Create member DTO
export interface CreateMemberDto {
  fullName: string;
  email: string;
  phone?: string;
  tier?: MembershipTier;
  joinDate?: string;
  status?: MemberStatus;
  contactPreferences?: ContactPreferences;
}

// Update member DTO
export interface UpdateMemberDto {
  fullName?: string;
  email?: string;
  phone?: string;
  tier?: MembershipTier;
  status?: MemberStatus;
  contactPreferences?: ContactPreferences;
}

// Create contribution DTO
export interface CreateContributionDto {
  memberId: string;
  amount: number;
  currency?: Currency;
  frequency?: ContributionFrequency;
  paymentMethod?: PaymentMethod;
  date?: string;
  notes?: string;
}

export function useMembers() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [churnStats, setChurnStats] = useState<ChurnStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<MemberFilterOptions>({});
  const fetchIdRef = useRef(0);

  const authHeaders = (includeCsrf = true): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (includeCsrf) {
      const csrf = getCSRFToken();
      if (csrf) h['X-CSRF-Token'] = csrf;
    }
    return h;
  };

  const fetchMembers = useCallback(async () => {
    const token = (session as any)?.authToken;
    const thisFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // Build query string from filter options
      const queryParams = new URLSearchParams();
      if (filterOptions.status) queryParams.append('status', filterOptions.status);
      if (filterOptions.tier) queryParams.append('tier', filterOptions.tier);
      if (filterOptions.search) queryParams.append('search', filterOptions.search);

      const queryString = queryParams.toString();
      const url = `${API_URL}/api/members${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to fetch members');
        if (thisFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
        return;
      }

      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) {
        setMembers(data);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) {
        setError(err.message);
        setIsLoading(false);
      }
    }
  }, [session, filterOptions]);

  const fetchMemberStats = useCallback(async () => {
    const token = (session as any)?.authToken;

    try {
      const res = await fetch(`${API_URL}/api/members/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to fetch stats');
        return;
      }

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [session]);

  const fetchChurnStats = useCallback(async () => {
    const token = (session as any)?.authToken;

    try {
      const res = await fetch(`${API_URL}/api/members/churn-stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to fetch churn stats');
        return;
      }

      const data = await res.json();
      setChurnStats(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [session]);

  useEffect(() => {
    fetchMembers();
    fetchMemberStats();
    fetchChurnStats();
  }, [fetchMembers, fetchMemberStats, fetchChurnStats]);

  const createMember = async (member: CreateMemberDto) => {
    const res = await fetch(`${API_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(member),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create member' }));
      return { success: false as const, error: err.error || 'Failed to create member' };
    }

    await fetchMembers();
    await fetchMemberStats();
    return { success: true as const };
  };

  const updateMember = async (id: string, member: UpdateMemberDto) => {
    const res = await fetch(`${API_URL}/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(member),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update member' }));
      return { success: false as const, error: err.error || 'Failed to update member' };
    }

    await fetchMembers();
    return { success: true as const };
  };

  const deleteMember = async (id: string) => {
    const res = await fetch(`${API_URL}/api/members/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete member' }));
      return { success: false as const, error: err.error || 'Failed to delete member' };
    }

    await fetchMembers();
    await fetchMemberStats();
    return { success: true as const };
  };

  const updateMemberStatus = async (id: string, status: MemberStatus) => {
    const res = await fetch(`${API_URL}/api/members/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update status' }));
      return { success: false as const, error: err.error || 'Failed to update status' };
    }

    await fetchMembers();
    return { success: true as const };
  };

  const getMemberById = async (id: string): Promise<Member | null> => {
    const token = (session as any)?.authToken;

    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch member');
      }

      return await res.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const getContributionsByMember = async (memberId: string): Promise<Contribution[]> => {
    const token = (session as any)?.authToken;

    try {
      const res = await fetch(`${API_URL}/api/members/${memberId}/contributions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch contributions');
      }

      return await res.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const createContribution = async (contribution: CreateContributionDto) => {
    const res = await fetch(`${API_URL}/api/members/${contribution.memberId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(contribution),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create contribution' }));
      return { success: false as const, error: err.error || 'Failed to create contribution' };
    }

    return { success: true as const };
  };

  const getAtRiskMembers = async (): Promise<Member[]> => {
    const token = (session as any)?.authToken;

    try {
      const res = await fetch(`${API_URL}/api/members/at-risk`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch at-risk members');
      }

      return await res.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const importMembersFromCSV = async (csvData: { members: CreateMemberDto[]; contributions: CreateContributionDto[] }) => {
    const res = await fetch(`${API_URL}/api/members/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(csvData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to import CSV' }));
      return { success: false as const, error: err.error || 'Failed to import CSV' };
    }

    await fetchMembers();
    await fetchMemberStats();
    return { success: true as const };
  };

  // Helper to parse contact preferences from JSON string
  const parseContactPreferences = (member: Member): ContactPreferences => {
    try {
      if (member.contact_preferences) {
        return JSON.parse(member.contact_preferences);
      }
    } catch {
      // Return default preferences if parsing fails
      return { email: true, phone: false, mail: false };
    }
    return { email: true, phone: false, mail: false };
  };

  // Filter members based on current filter options
  const filteredMembers = members.filter((member) => {
    if (filterOptions.status && member.status !== filterOptions.status) return false;
    if (filterOptions.tier && member.tier !== filterOptions.tier) return false;
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      if (!member.full_name.toLowerCase().includes(searchLower) &&
          !member.email.toLowerCase().includes(searchLower) &&
          !(member.phone || '').toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  return {
    members: filteredMembers,
    allMembers: members,
    isLoading,
    error,
    stats,
    churnStats,
    filterOptions,
    setFilterOptions,
    createMember,
    updateMember,
    deleteMember,
    updateMemberStatus,
    getMemberById,
    getContributionsByMember,
    createContribution,
    getAtRiskMembers,
    importMembersFromCSV,
    parseContactPreferences,
    refetch: () => {
      fetchMembers();
      fetchMemberStats();
      fetchChurnStats();
    },
  };
}
