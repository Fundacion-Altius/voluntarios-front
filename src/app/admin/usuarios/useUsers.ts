'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface User {
  user_id: string;
  email: string;
  display_name: string;
  role?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      if (!res.ok) throw new Error('Failed to fetch users');
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

  const createUser = async (user: { name: string; email: string; role: string; password?: string }) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create user' }));
      throw new Error(err.error || 'Failed to create user');
    }
    await fetchUsers();
  };

  const updateUser = async (id: string, user: { display_name?: string; email?: string }) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to update user');
    await fetchUsers();
  };

  const updateUserRole = async (id: string, role: string) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete user');
    await fetchUsers();
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
