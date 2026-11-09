'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { comanderoApi } from './api';
import type {
  FloorState,
  MenuItem,
  OpenSession,
  QueueLine,
  SessionMenuItem,
  SessionSummary,
  Station,
} from './types';

/** Polling interval for the teacher floor view and station queues (ms). */
export const POLL_INTERVAL_MS = 3000;

interface MenuState {
  menu: MenuItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (input: { name: string; category: string; price_cents: number; allergen_code?: string | null }) => Promise<string | null>;
  removeItem: (id: string) => Promise<string | null>;
}

/** Classroom menu CRUD (docente). */
export function useComanderoMenu(): MenuState {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await comanderoApi.listMenu();
    if (res.success) setMenu(res.data);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem: MenuState['addItem'] = async (input) => {
    const res = await comanderoApi.createMenuItem(input);
    if (!res.success) return res.error;
    await refresh();
    return null;
  };

  const removeItem: MenuState['removeItem'] = async (id) => {
    const res = await comanderoApi.deleteMenuItem(id);
    if (!res.success) return res.error;
    await refresh();
    return null;
  };

  return { menu, loading, error, refresh, addItem, removeItem };
}

/** Floor state with polling (teacher view). */
export function useComanderoFloor(sessionId: string | null) {
  const [floor, setFloor] = useState<FloorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(async () => {
    if (!sessionId) return;
    const res = await comanderoApi.getFloor(sessionId);
    if (res.success) {
      setFloor(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    void tick().finally(() => setLoading(false));
    timer.current = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [sessionId, tick]);

  return { floor, error, loading, refresh: tick };
}

/** Station queue with polling (estación: cocina/barra). */
export function useComanderoStation(sessionId: string | null, station: Station) {
  const [lines, setLines] = useState<QueueLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(async () => {
    if (!sessionId) return;
    const res = await comanderoApi.stationQueue(sessionId, station);
    if (res.success) {
      setLines(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [sessionId, station]);

  useEffect(() => {
    if (!sessionId) return;
    void tick();
    timer.current = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [sessionId, tick]);

  const advance = async (lineId: string) => {
    const res = await comanderoApi.advanceLine(lineId);
    await tick();
    return res.success ? null : res.error;
  };

  return { lines, error, advance, refresh: tick };
}

/**
 * Services the student can join, by name. Polled so a service the teacher just opened shows up
 * on its own, and one that was closed disappears.
 */
export function useComanderoOpenSessions() {
  const [sessions, setSessions] = useState<OpenSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await comanderoApi.listOpenSessions();
    if (res.success) {
      setSessions(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { sessions, loaded, error, refresh };
}

/** Snapshot (carta frozen at session start) for the waiter to add items. */
export function useComanderoSnapshot(sessionId: string | null) {
  const [snapshot, setSnapshot] = useState<SessionMenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void comanderoApi.getSnapshot(sessionId).then((res) => {
      if (res.success) setSnapshot(res.data);
      else setError(res.error);
    });
  }, [sessionId]);

  return { snapshot, error };
}

export type { SessionSummary };
