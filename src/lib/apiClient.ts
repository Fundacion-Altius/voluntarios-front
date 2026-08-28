import { useState, useEffect, useCallback } from 'react';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type Result<T> = { success: true; data: T } | { success: false; error: string };

export async function apiClient<T>(url: string, options?: RequestInit): Promise<Result<T>> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.message || body.error || `Request failed with status ${res.status}` };
  }
  try {
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to parse response' };
  }
}

export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}${path}`;
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
