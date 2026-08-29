'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export interface HitlQueueItem {
  id: string;
  tenantId: string;
  agentId: string;
  triggeringUserId: string;
  actionType: string;
  payloadDiff: string;
  scopes: string;
  plane: 'hot' | 'cold';
  confidence: number;
  status: 'pending' | 'allowed' | 'denied' | 'edited';
  createdAt: string;
}

export interface PilotKpi {
  submittedOutputs: number;
  outputsWithoutSignOff: number;
  pending: number;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return typeof body.error === 'string' ? body.error : fallback;
}

export function useHitlInbox() {
  const { data: session } = useSession();
  const [items, setItems] = useState<HitlQueueItem[]>([]);
  const [kpi, setKpi] = useState<PilotKpi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = (session as { authToken?: string } | null)?.authToken;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [queueRes, kpiRes] = await Promise.all([
        fetch(`${API_URL}/api/hitl`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/hitl/kpi`, { headers, credentials: 'include' }),
      ]);
      if (!queueRes.ok) {
        setError(await readError(queueRes, 'Failed to fetch HITL queue'));
        return;
      }
      if (!kpiRes.ok) {
        setError(await readError(kpiRes, 'Failed to fetch HITL KPI'));
        return;
      }
      setItems(await queueRes.json());
      setKpi(await kpiRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HITL inbox');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const postAction = useCallback(
    async (path: string, body?: Record<string, string>) => {
      const res = await fetch(`${API_URL}/api/hitl/${path}`, {
        method: 'POST',
        headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(await readError(res, 'HITL action failed'));
      await refresh();
    },
    [headers, refresh],
  );

  const allow = useCallback((id: string) => postAction(`${id}/allow`), [postAction]);
  const deny = useCallback((id: string) => postAction(`${id}/deny`), [postAction]);
  const edit = useCallback(
    (id: string, payloadDiff: string) => postAction(`${id}/edit`, { payloadDiff }),
    [postAction],
  );

  return { items, kpi, isLoading, error, allow, deny, edit, refresh };
}
