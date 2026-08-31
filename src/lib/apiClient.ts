import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/apiUrl';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type Result<T> = { success: true; data: T } | { success: false; error: string };

async function request<T>(url: string, options?: RequestInit): Promise<Result<T>> {
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  const res = await fetch(url, {
    credentials: 'include',
    headers: isFormData
      ? { ...options?.headers }
      : { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.message || body.error || `Request failed with status ${res.status}` };
  }
  try {
    const data = await res.json();
    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to parse response' };
  }
}

export type ApiClient = {
  <T>(url: string, options?: RequestInit): Promise<Result<T>>;
  get: <T>(url: string) => Promise<Result<T>>;
  post: <T>(url: string, body?: unknown) => Promise<Result<T>>;
  put: <T>(url: string, body?: unknown) => Promise<Result<T>>;
  patch: <T>(url: string, body?: unknown) => Promise<Result<T>>;
  delete: <T>(url: string) => Promise<Result<T>>;
  postForm: <T>(url: string, formData: FormData) => Promise<Result<T>>;
};

const apiClientImpl = request as ApiClient;
apiClientImpl.get = (url) => request(url);
apiClientImpl.post = (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) });
apiClientImpl.put = (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) });
apiClientImpl.patch = (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) });
apiClientImpl.delete = (url) => request(url, { method: 'DELETE' });
apiClientImpl.postForm = (url, formData) => request(url, { method: 'POST', body: formData });

export const apiClient = apiClientImpl;

export function unwrap<T>(result: Result<T>, fallback: T): T {
  return result.success ? result.data : fallback;
}

export function unwrapOrThrow<T>(result: Result<T>): T {
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

export function useApi<T>(fetcher: () => Promise<Result<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Error inesperado'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}
