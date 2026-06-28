'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { SortingState } from '@tanstack/react-table';
import { useDebounce } from './useDebounce';

interface Contract {
  id: string;
  nombre: string;
  email: string;
  areas: string[];
  fecha: string;
  empresa: string | null;
  lugar: string | null;
}

interface PaginatedResponse {
  data: Contract[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UseContractsReturn {
  data: Contract[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorting: (sorting: SortingState) => void;
  setSearch: (search: string) => void;
  setAreas: (areas: string[]) => void;
  setLugares: (lugares: string[]) => void;
  search: string;
  sorting: SortingState;
  areas: string[];
  lugares: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useContracts(): UseContractsReturn {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [lugares, setLugares] = useState<string[]>([]);
  const [data, setData] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, areas, lugares]);

  useEffect(() => {
    const token = (session as any)?.authToken;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    }
    if (debouncedSearch) params.set('search', debouncedSearch);
    areas.forEach((a) => params.append('areas', a));
    lugares.forEach((l) => params.append('lugares', l));

    setIsLoading(true);
    setError(null);

    const thisFetchId = ++fetchIdRef.current;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    fetch(`${API_URL}/api/contracts?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch contracts');
        return res.json();
      })
      .then((json: PaginatedResponse) => {
        if (thisFetchId !== fetchIdRef.current) return;
        setData(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (thisFetchId !== fetchIdRef.current) return;
        if (err.name === 'AbortError') {
          setError('La solicitud tardó demasiado. Intenta de nuevo.');
        } else {
          setError(err.message);
        }
        setIsLoading(false);
      })
      .finally(() => clearTimeout(timeoutId));
  }, [page, pageSize, sorting, debouncedSearch, areas, lugares, session]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleAreas = (newAreas: string[]) => {
    setAreas(newAreas);
    setPage(1);
  };

  const handleLugares = (newLugares: string[]) => {
    setLugares(newLugares);
    setPage(1);
  };

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    setPage,
    setPageSize: handlePageSizeChange,
    setSorting,
    setSearch,
    setAreas: handleAreas,
    setLugares: handleLugares,
    search,
    sorting,
    areas,
    lugares,
  };
}

export function useCreateContract() {
  return async (contractData: any) => {
    const { apiPost } = await import('@/app/lib/csrf');
    const response = await apiPost('/api/contracts', contractData);
    if (!response.ok) {
      throw new Error(`Failed to create contract: ${response.status}`);
    }
    return response.json();
  };
}

export function useDeleteContract() {
  return async (id: string) => {
    const { apiDelete } = await import('@/app/lib/csrf');
    const response = await apiDelete(`/api/contracts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to delete contract: ${response.status}`);
    }
  };
}
