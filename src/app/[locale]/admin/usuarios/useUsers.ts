'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getCSRFToken } from '@/app/lib/csrf';

export interface User {
  user_id: string;
  email: string;
  display_name: string;
  role?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export function useUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const fetchIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const token = (session as any)?.authToken;
    const thisFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to fetch users');
        if (thisFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
        return;
      }
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) {
        setUsers(data);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) {
        setError(err.message);
        setIsLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const createUser = async (user: { name: string; email: string; role: string; password?: string }) => {
    const res = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create user' }));
      return { success: false as const, error: err.error || 'Failed to create user' };
    }
    await fetchUsers();
    return { success: true as const };
  };

  const updateUser = async (id: string, user: { display_name?: string; email?: string }) => {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update user' }));
      return { success: false as const, error: err.error || 'Failed to update user' };
    }
    await fetchUsers();
    return { success: true as const };
  };

  const updateUserRole = async (id: string, role: string) => {
    const res = await fetch(`${API_URL}/api/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update role' }));
      return { success: false as const, error: err.error || 'Failed to update role' };
    }
    await fetchUsers();
    return { success: true as const };
  };

  const deleteUser = async (id: string) => {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete user' }));
      return { success: false as const, error: err.error || 'Failed to delete user' };
    }
    await fetchUsers();
    return { success: true as const };
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return {
    users: filteredUsers,
    allUsers: users,
    isLoading,
    error,
    search,
    setSearch,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
    refetch: fetchUsers,
  };
}
