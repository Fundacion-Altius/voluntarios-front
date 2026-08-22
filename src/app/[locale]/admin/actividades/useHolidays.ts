'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';
import { getApiBaseUrl } from '@/lib/apiUrl';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  region: string;
  source: string;
  active: string;
  created_at: string;
}

const API_URL = getApiBaseUrl();

export function useHolidays() {
  const { data: session } = useSession();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
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

  const fetchHolidays = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/activities/holidays`, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar festivos');
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) {
        const list: Holiday[] = Array.isArray(data) ? data : [];
        setHolidays(list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setIsLoading(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) { setError(err.message); setIsLoading(false); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const addHoliday = async (data: { date: string; name: string; region: string }) => {
    const res = await fetch(`${API_URL}/api/activities/holidays`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    await fetchHolidays();
  };

  const setHolidayActive = async (id: string, active: boolean) => {
    const res = await fetch(`${API_URL}/api/activities/holidays/${id}/${active ? 'activate' : 'deactivate'}`, {
      method: 'PUT', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al actualizar festivo');
    await fetchHolidays();
  };

  const deleteHoliday = async (id: string) => {
    const res = await fetch(`${API_URL}/api/activities/holidays/${id}`, {
      method: 'DELETE', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al eliminar festivo');
    await fetchHolidays();
  };

  return { holidays, isLoading, error, addHoliday, setHolidayActive, deleteHoliday, refetch: fetchHolidays };
}
