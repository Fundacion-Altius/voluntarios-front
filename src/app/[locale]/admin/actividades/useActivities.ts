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
  localidad?: string | null;
  fixed_date?: string | null;
  created_at: string;
}

export interface ActivityException {
  id: string;
  activity_type_id: string;
  date: string;
  reason?: string | null;
}

import { getApiBaseUrl } from '@/lib/apiUrl';

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
      const res = await fetch(`${getApiBaseUrl()}/api/activities/types`, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Error al cargar tipos de actividad');
        if (thisFetchId === fetchIdRef.current) { setIsLoading(false); }
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      if (thisFetchId === fetchIdRef.current) { setTypes(list); setIsLoading(false); }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) { setError(err.message); setIsLoading(false); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const createType = async (data: any) => {
    const res = await fetch(`${getApiBaseUrl()}/api/activities/types`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) { 
      const e = await res.json().catch(() => ({ error: 'Error' }));
      return { success: false as const, error: e.error || 'Error' };
    }
    await fetchTypes();
    return { success: true as const };
  };

  const updateType = async (id: string, data: any) => {
    const res = await fetch(`${getApiBaseUrl()}/api/activities/types/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) { 
      const e = await res.json().catch(() => ({ error: 'Error' }));
      return { success: false as const, error: e.error || 'Error' };
    }
    await fetchTypes();
    return { success: true as const };
  };

  const deleteType = async (id: string) => {
    const res = await fetch(`${getApiBaseUrl()}/api/activities/types/${id}`, {
      method: 'DELETE', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error al eliminar' }));
      return { success: false as const, error: e.error || 'Error al eliminar' };
    }
    await fetchTypes();
    return { success: true as const };
  };

  const fetchExceptions = async (typeId: string): Promise<ActivityException[]> => {
    const res = await fetch(`${getApiBaseUrl()}/api/activities/exceptions/${typeId}`, { headers: authHeaders(), credentials: 'include' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Error al cargar excepciones:', errorData.error || errorData.message);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const createException = async (typeId: string, data: { date: string; reason?: string }) => {
    const res = await fetch(`${getApiBaseUrl()}/api/activities/exceptions/${typeId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) { 
      const e = await res.json().catch(() => ({ error: 'Error' }));
      return { success: false as const, error: e.error || 'Error' };
    }
    return { success: true as const };
  };

  const deleteException = async (id: string) => {
    const res = await fetch(`${getApiBaseUrl()}/api/activities/exceptions/${id}`, {
      method: 'DELETE', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error al eliminar' }));
      return { success: false as const, error: e.error || 'Error al eliminar' };
    }
    return { success: true as const };
  };

  return { types, isLoading, error, createType, updateType, deleteType, fetchExceptions, createException, deleteException, refetch: fetchTypes };
}
