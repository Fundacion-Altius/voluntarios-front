"use client";

import { useCallback, useEffect, useState } from "react";
import { platformApi } from "@/lib/platform/api";
import type { PlatformUser } from "@/types/platform";

/**
 * Platform auth hook. Relies on the HttpOnly cookie set by the backend on
 * login; no client-side token persistence. `me()` validates the session.
 */
export function usePlatformAuth() {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate the session via the cookie; if it fails, we're logged out.
    platformApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { user: u } = await platformApi.login(email, password);
      setUser(u);
      return u;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await platformApi.logout();
    } catch {
      // ignore server logout errors, clear locally anyway
    }
    setUser(null);
  }, []);

  return { user, loading, error, login, logout, isAuthenticated: !!user };
}
