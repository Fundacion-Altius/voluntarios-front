"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformToken, platformApi, setPlatformToken } from "@/lib/platform/api";
import type { PlatformUser } from "@/types/platform";

export function usePlatformAuth() {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getPlatformToken();
    if (!token) {
      setLoading(false);
      return;
    }
    platformApi
      .me()
      .then(setUser)
      .catch(() => setPlatformToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { token, user: u } = await platformApi.login(email, password);
      setPlatformToken(token);
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
    setPlatformToken(null);
    setUser(null);
  }, []);

  return { user, loading, error, login, logout, isAuthenticated: !!user };
}
