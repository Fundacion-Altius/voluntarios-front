'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';
import { getApiBaseUrl } from '@/lib/apiUrl';

const BASE = '/api/toys';

function headers(session: any) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = session?.authToken;
  if (token) h['Authorization'] = `Bearer ${token}`;
  const csrf = getCSRFToken();
  if (csrf) h['X-CSRF-Token'] = csrf;
  return h;
}

async function call(session: any, path: string, init?: RequestInit) {
  const res = await fetch(`${getApiBaseUrl()}${BASE}${path}`, {
    ...init,
    headers: headers(session),
    credentials: 'include',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false as const, error: body.error || `Error ${res.status}` };
  return { success: true as const, data: body };
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

async function multipart(session: any, path: string, form: FormData) {
  const h: Record<string, string> = {};
  const token = session?.authToken;
  if (token) h['Authorization'] = `Bearer ${token}`;
  const csrf = getCSRFToken();
  if (csrf) h['X-CSRF-Token'] = csrf;
  const res = await fetch(`${getApiBaseUrl()}${BASE}${path}`, { method: 'POST', headers: h, credentials: 'include', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false as const, error: body.error || `Error ${res.status}` };
  return { success: true as const, data: body };
}

export function useToys() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);

  const fetchStatus = useCallback(async () => {
    const r = await pub('/status');
    if (r.success) setStatus(r.data);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    listChildren: () => call(session, '/children'),
    addChild: (label: string, age: number) => call(session, '/children', { method: 'POST', body: JSON.stringify({ label, age }) }),
    listBeneficiaries: () => call(session, '/beneficiaries'),
    addChildFromMember: (member_id: string, age: number) =>
      call(session, '/children/from-member', { method: 'POST', body: JSON.stringify({ member_id, age }) }),
    uploadChildren: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return multipart(session, '/children/upload', form);
    },
    uploadPictures: async (itemId: string, files: FileList | File[]) => {
      const form = new FormData();
      for (const file of Array.from(files).slice(0, 5)) form.append('pictures', file);
      return multipart(session, `/items/${itemId}/pictures`, form);
    },
    setCover: (itemId: string, picture: string) =>
      call(session, `/items/${itemId}/cover`, { method: 'PATCH', body: JSON.stringify({ picture }) }),
    listSlots: () => pub('/slots'),
    addSlot: (date: string, label: string) => call(session, '/slots', { method: 'POST', body: JSON.stringify({ date, label }) }),
    listItems: (age?: number | string) =>
      call(
        session,
        age === undefined ? '/items' : typeof age === 'string' ? `/items?ageBand=${age}` : `/items?age=${age}`,
      ),
    addItem: (title: string, ageBand: string, quantity: number, location: string, description = "", ean = "") =>
      call(session, '/items', { method: 'POST', body: JSON.stringify({ title, ageBand, quantity, location, description, ean }) }),
    removePicture: (itemId: string, filename: string) =>
      call(session, `/items/${itemId}/pictures/${filename}`, { method: 'DELETE' }),
    deleteItem: (id: string) => call(session, `/items/${id}`, { method: 'DELETE' }),
    updateItem: (id: string, patch: Record<string, unknown>) =>
      call(session, `/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    createCart: (household_id: string) => pub('/carts', { method: 'POST', body: JSON.stringify({ household_id }) }),
    addLine: (cartId: string, toy_id: string, qty: number) =>
      pub(`/carts/${cartId}/lines`, { method: 'POST', body: JSON.stringify({ toy_id, qty }) }),
    removeLine: (cartId: string, toy_id: string) => pub(`/carts/${cartId}/lines/${toy_id}`, { method: 'DELETE' }),
    checkout: (cartId: string) => pub(`/carts/${cartId}/checkout`, { method: 'POST' }),
    bookSlot: (slotId: string, household_id: string) =>
      pub(`/slots/${slotId}/book`, { method: 'POST', body: JSON.stringify({ household_id }) }),
    scan: (token: string) => call(session, '/scan', { method: 'POST', body: JSON.stringify({ token }) }),
    pending: () => call(session, '/pending'),
    closeItem: (toy_id: string, quantity: number, kind: string, destination: string) =>
      call(session, '/close', { method: 'POST', body: JSON.stringify({ toy_id, quantity, kind, destination }) }),
    listDispositions: () => call(session, '/dispositions'),
    listBookings: () => call(session, '/bookings'),
  };
}
