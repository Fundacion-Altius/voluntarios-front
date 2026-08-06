'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';

export interface Candidate {
  user_id: string;
  email: string;
  display_name: string;
  status: string;
  created_at: string;
}

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export function useCandidates() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchHeaders = (includeCsrf = true): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (includeCsrf) {
      const csrf = getCSRFToken();
      if (csrf) h['X-CSRF-Token'] = csrf;
    }
    return h;
  };

  const fetchCandidates = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/candidates`, {
        headers: fetchHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al cargar candidatos');
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) {
        setCandidates(data);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) {
        setError(err.message);
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const approveCandidate = async (id: string) => {
    const res = await fetch(`${API_URL}/api/candidates/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...fetchHeaders() },
      credentials: 'include',
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchCandidates();
  };

  const reserveCandidate = async (id: string) => {
    const res = await fetch(`${API_URL}/api/candidates/${id}/reserve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...fetchHeaders() },
      credentials: 'include',
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchCandidates();
  };

  const deactivateUser = async (id: string) => {
    const res = await fetch(`${API_URL}/api/users/${id}/deactivate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...fetchHeaders() },
      credentials: 'include',
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchCandidates();
  };

  const bulkImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/candidates/bulk-import`, {
      method: 'POST',
      headers: fetchHeaders(),
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchCandidates();
    return res.json();
  };

  return { candidates, isLoading, error, approveCandidate, reserveCandidate, deactivateUser, bulkImport, refetch: fetchCandidates };
}
