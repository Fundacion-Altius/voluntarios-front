'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { getAuthToken, getCSRFToken } from '@/app/lib/csrf';
import { hadSession } from '@/app/auth/AuthProvider';
import { getApiBaseUrl } from '@/lib/apiUrl';

const BASE = '/api/toys';

function authHeaders(session: { authToken?: string } | null | undefined): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = session?.authToken || getAuthToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  const csrf = getCSRFToken();
  if (csrf) h['X-CSRF-Token'] = csrf;
  return h;
}

function redirectToLogin(locale: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(`/${locale}/login`);
}

async function call(
  session: { authToken?: string } | null | undefined,
  path: string,
  locale: string,
  init?: RequestInit,
) {
  const token = session?.authToken || getAuthToken();
  if (!token) {
    return { success: false as const, error: 'Sin sesión', code: 'no_session', status: 401 };
  }
  const res = await fetch(`${getApiBaseUrl()}${BASE}${path}`, {
    ...init,
    headers: authHeaders(session),
    credentials: 'include',
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (hadSession()) redirectToLogin(locale);
    return { success: false as const, error: body.error || 'Sesión caducada', code: 'unauthorized', status: 401 };
  }
  if (!res.ok) {
    return { success: false as const, error: body.error || `Error ${res.status}`, code: body.code as string | undefined, status: res.status };
  }
  return { success: true as const, data: body };
}

export interface SlotInput {
  date?: string;
  label?: string;
  start_time?: string | null;
  end_time?: string | null;
  capacity?: number | null;
}

const pub = async (path: string, init?: RequestInit) => {
  const method = (init?.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && !getCSRFToken()) {
    await fetch(`${getApiBaseUrl()}/api/csrf-token`, { credentials: 'include' });
  }
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const csrf = getCSRFToken();
  if (csrf) h['X-CSRF-Token'] = csrf;
  const res = await fetch(`${getApiBaseUrl()}${BASE}${path}`, {
    ...init,
    headers: { ...h, ...(init?.headers as Record<string, string> | undefined) },
    credentials: 'include',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false as const, error: body.error || `Error ${res.status}` };
  return { success: true as const, data: body };
};

async function multipart(
  session: { authToken?: string } | null | undefined,
  path: string,
  locale: string,
  form: FormData,
) {
  const token = session?.authToken || getAuthToken();
  if (!token) {
    return { success: false as const, error: 'Sin sesión' };
  }
  const h: Record<string, string> = {};
  h['Authorization'] = `Bearer ${token}`;
  const csrf = getCSRFToken();
  if (csrf) h['X-CSRF-Token'] = csrf;
  const res = await fetch(`${getApiBaseUrl()}${BASE}${path}`, { method: 'POST', headers: h, credentials: 'include', body: form });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (hadSession()) redirectToLogin(locale);
    return { success: false as const, error: body.error || 'Sesión caducada' };
  }
  if (!res.ok) return { success: false as const, error: body.error || `Error ${res.status}` };
  return { success: true as const, data: body };
}

export function useToys() {
  const { data: session, status: sessionStatus } = useSession();
  const locale = useLocale();
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const ready = sessionStatus === 'authenticated' && !!(session?.authToken || getAuthToken());

  const fetchStatus = useCallback(async () => {
    const r = await pub('/status');
    if (r.success) setStatus(r.data);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const authed = useCallback(
    (path: string, init?: RequestInit) => call(session, path, locale, init),
    [session, locale],
  );

  return {
    status,
    ready,
    listChildren: () => authed('/children'),
    addChild: (label: string, age: number) => authed('/children', { method: 'POST', body: JSON.stringify({ label, age }) }),
    listBeneficiaries: () => authed('/beneficiaries'),
    addChildFromMember: (member_id: string, age: number) =>
      authed('/children/from-member', { method: 'POST', body: JSON.stringify({ member_id, age }) }),
    uploadChildren: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return multipart(session, '/children/upload', locale, form);
    },
    uploadPictures: async (itemId: string, files: FileList | File[]) => {
      const form = new FormData();
      for (const file of Array.from(files).slice(0, 5)) form.append('pictures', file);
      return multipart(session, `/items/${itemId}/pictures`, locale, form);
    },
    setCover: (itemId: string, picture: string) =>
      authed(`/items/${itemId}/cover`, { method: 'PATCH', body: JSON.stringify({ picture }) }),
    listSlots: () => pub('/slots'),
    addSlot: (date: string, label: string, extra: Omit<SlotInput, 'date' | 'label'> = {}) =>
      authed('/slots', { method: 'POST', body: JSON.stringify({ date, label, ...extra }) }),
    updateSlot: (id: string, patch: SlotInput) => authed(`/slots/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    deleteSlot: (id: string) => authed(`/slots/${id}`, { method: 'DELETE' }),
    updateChild: (id: string, patch: { label?: string; age?: number }) =>
      authed(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    deleteChild: (id: string) => authed(`/children/${id}`, { method: 'DELETE' }),
    previewChildren: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return multipart(session, '/children/upload?dry_run=1', locale, form);
    },
    listFamilies: () => authed('/families'),
    addHousehold: (toy_quota: number, code?: string) =>
      authed('/households', { method: 'POST', body: JSON.stringify(code ? { code, toy_quota } : { toy_quota }) }),
    updateHousehold: (code: string, toy_quota: number) =>
      authed(`/households/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify({ toy_quota }) }),
    deleteHousehold: (code: string) => authed(`/households/${encodeURIComponent(code)}`, { method: 'DELETE' }),
    adjustItem: (id: string, delta: number) =>
      authed(`/items/${id}/adjust`, { method: 'POST', body: JSON.stringify({ delta }) }),
    scanLookup: (token: string) => authed('/scan/lookup', { method: 'POST', body: JSON.stringify({ token }) }),
    scanConfirm: (token: string) => authed('/scan/confirm', { method: 'POST', body: JSON.stringify({ token }) }),
    scanProblem: (token: string, note: string) =>
      authed('/scan/problem', { method: 'POST', body: JSON.stringify({ token, note }) }),
    handoverSummary: () => authed('/handover/summary'),
    deleteDisposition: (id: string) => authed(`/dispositions/${id}`, { method: 'DELETE' }),
    listItems: (age?: number | string) =>
      authed(age === undefined ? '/items' : typeof age === 'string' ? `/items?ageBand=${age}` : `/items?age=${age}`),
    addItem: (title: string, ageBand: string, quantity: number, location: string, description = "", ean = "") =>
      authed('/items', { method: 'POST', body: JSON.stringify({ title, ageBand, quantity, location, description, ean }) }),
    removePicture: (itemId: string, filename: string) =>
      authed(`/items/${itemId}/pictures/${filename}`, { method: 'DELETE' }),
    deleteItem: (id: string) => authed(`/items/${id}`, { method: 'DELETE' }),
    updateItem: (id: string, patch: Record<string, unknown>) =>
      authed(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    lookupHousehold: (code: string) => pub(`/households/${encodeURIComponent(code.trim())}`),
    createCart: (household_id: string) => pub('/carts', { method: 'POST', body: JSON.stringify({ household_id }) }),
    addLine: (cartId: string, toy_id: string, qty: number) =>
      pub(`/carts/${cartId}/lines`, { method: 'POST', body: JSON.stringify({ toy_id, qty }) }),
    removeLine: (cartId: string, toy_id: string) => pub(`/carts/${cartId}/lines/${toy_id}`, { method: 'DELETE' }),
    checkout: (cartId: string) => pub(`/carts/${cartId}/checkout`, { method: 'POST' }),
    bookSlot: (slotId: string, household_id: string) =>
      pub(`/slots/${slotId}/book`, { method: 'POST', body: JSON.stringify({ household_id }) }),
    scan: (token: string) => authed('/scan', { method: 'POST', body: JSON.stringify({ token }) }),
    pending: () => authed('/pending'),
    closeItem: (toy_id: string, quantity: number, kind: string, destination: string) =>
      authed('/close', { method: 'POST', body: JSON.stringify({ toy_id, quantity, kind, destination }) }),
    listDispositions: () => authed('/dispositions'),
    listBookings: () => authed('/bookings'),
  };
}
