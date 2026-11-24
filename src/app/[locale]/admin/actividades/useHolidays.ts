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

function buildAuthHeaders(session: unknown, includeCsrf: boolean): Record<string, string> {
  const token = (session as any)?.authToken;
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (includeCsrf) {
    const csrf = getCSRFToken();
    if (csrf) h['X-CSRF-Token'] = csrf;
  }
  return h;
}

async function failureFrom(res: Response, fallback: string) {
  const e = await res.json().catch(() => ({ error: fallback }));
  return { success: false as const, error: e.error || fallback };
}

function sortHolidays(data: unknown): Holiday[] {
  const list: Holiday[] = Array.isArray(data) ? data : [];
  return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function useHolidays() {
  const { data: session } = useSession();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const authHeaders = (includeCsrf = true) => buildAuthHeaders(session, includeCsrf);

  const fetchHolidays = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/activities/holidays`, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Error al cargar festivos');
        if (thisFetchId === fetchIdRef.current) { setIsLoading(false); }
        return;
      }
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) {
        setHolidays(sortHolidays(data));
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
    if (!res.ok) return failureFrom(res, 'Error');
    await fetchHolidays();
    return { success: true as const };
  };

  const setHolidayActive = async (id: string, active: boolean) => {
    const res = await fetch(`${API_URL}/api/activities/holidays/${id}/${active ? 'activate' : 'deactivate'}`, {
      method: 'PUT', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) return failureFrom(res, 'Error al actualizar festivo');
    await fetchHolidays();
    return { success: true as const };
  };

  const deleteHoliday = async (id: string) => {
    const res = await fetch(`${API_URL}/api/activities/holidays/${id}`, {
      method: 'DELETE', headers: authHeaders(), credentials: 'include',
    });
    if (!res.ok) return failureFrom(res, 'Error al eliminar festivo');
    await fetchHolidays();
    return { success: true as const };
  };

  return { holidays, isLoading, error, addHoliday, setHolidayActive, deleteHoliday, refetch: fetchHolidays };
}
