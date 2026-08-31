'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';
import { getApiBaseUrl } from '@/lib/apiUrl';

export interface CalendarEntry {
  activityTypeId: string;
  name: string;
  localidad?: string | null;
  date: string;
  shift: string;
  capacity: number;
  bookedCount: number;
  available: number;
  isCancelled: boolean;
}

export interface AttendanceRow {
  id: string;
  user_id: string;
  status: string;
  cancel_reason?: string | null;
  checkIn?: {
    id: string;
    check_in_at: string | null;
    check_out_at: string | null;
    duration_minutes: number | null;
  } | null;
}

export interface VolunteerOption {
  user_id: string;
  display_name?: string;
  email?: string;
}

export function useAttendance() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
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

  const jsonBody = async (res: Response) => {
    const data = await res.json();
    return data && typeof data === 'object' && 'success' in data ? data.data : data;
  };

  const fetchEntries = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    setIsLoadingEntries(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/activities/sessions`, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Error al cargar calendario');
        if (thisFetchId === fetchIdRef.current) { setIsLoadingEntries(false); }
        return;
      }
      const list: CalendarEntry[] = (await jsonBody(res)) ?? [];
      if (thisFetchId === fetchIdRef.current) {
        setEntries(list.filter((e) => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0))));
        setIsLoadingEntries(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) { setError(err.message); setIsLoadingEntries(false); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const fetchVolunteers = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/users`, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) return;
      const users = (await jsonBody(res)) ?? [];
      if (Array.isArray(users)) setVolunteers(users);
    } catch { /* non-blocking */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchVolunteers(); }, [fetchVolunteers]);

  const fetchAttendance = useCallback(async (activityTypeId: string, date: string, shift: string) => {
    setIsLoadingAttendance(true);
    setError(null);
    try {
      const url = `${getApiBaseUrl()}/api/activities/entries/${activityTypeId}/${encodeURIComponent(date)}/${encodeURIComponent(shift)}/attendance`;
      const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Error al cargar asistencia');
        return;
      }
      const rows: AttendanceRow[] = (await jsonBody(res)) ?? [];
      setAttendance(rows);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingAttendance(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const addWalkIn = async (activityTypeId: string, date: string, shift: string, volunteerId: string) => {
    const url = `${getApiBaseUrl()}/api/activities/entries/${activityTypeId}/${encodeURIComponent(date)}/${encodeURIComponent(shift)}/add-volunteer`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, credentials: 'include',
      body: JSON.stringify({ volunteerId }),
    });
    if (!res.ok) { 
      const e = await res.json().catch(() => ({ error: 'Error' }));
      return { success: false as const, error: e.error || 'Error' };
    }
    await fetchAttendance(activityTypeId, date, shift);
    return { success: true as const };
  };

  const postBookingAction = async (path: string) => {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Error' }));
      throw new Error(e.error || 'Error');
    }
  };

  const checkIn = async (bookingId: string, activityTypeId: string, date: string, shift: string) => {
    await postBookingAction(`/api/activities/sessions/${activityTypeId}/check-in/${bookingId}`);
    await fetchAttendance(activityTypeId, date, shift);
  };

  const checkOut = async (bookingId: string, activityTypeId: string, date: string, shift: string) => {
    await postBookingAction(`/api/activities/sessions/${activityTypeId}/check-out/${bookingId}`);
    await fetchAttendance(activityTypeId, date, shift);
  };

  return { entries, attendance, volunteers, isLoadingEntries, isLoadingAttendance, error, fetchAttendance, addWalkIn, checkIn, checkOut };
}
