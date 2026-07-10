'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';

export interface ActivityType {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_recurring: string;
  default_capacity: number;
  recurrence_config?: any;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useActivities() {
  const { data: session } = useSession();
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchTypes = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/activities/types`, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar tipos de actividad');
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) { setTypes(data.success ? data.data : data); setIsLoading(false); }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) { setError(err.message); setIsLoading(false); }
    }
  }, [session]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const createType = async (data: any) => {
    const res = await fetch(`${API_URL}/api/activities/types`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchTypes();
  };

  const updateType = async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/api/activities/types/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchTypes();
  };

  const deleteType = async (id: string) => {
    const res = await fetch(`${API_URL}/api/activities/types/${id}`, {
      method: 'DELETE', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al eliminar');
    await fetchTypes();
  };

  return { types, isLoading, error, createType, updateType, deleteType, refetch: fetchTypes };
}
