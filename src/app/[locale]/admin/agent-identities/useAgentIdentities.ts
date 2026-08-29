'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export interface AgentScope {
  id: string;
  tenantId: string;
  agentId: string;
  scopeType: 'tool' | 'queue' | 'destination';
  scopeValue: string;
}

export interface AgentIdentity {
  id: string;
  tenantId: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  scopes: AgentScope[];
  credentialStatus: 'active' | 'revoked' | 'missing';
  credentialId?: string;
}

export interface AgentAuditEvent {
  id: string;
  tenantId: string;
  agentId: string;
  triggeringUserId: string;
  tool: string;
  resource: string;
  result: 'allowed' | 'denied' | 'error';
  hitl: 'yes' | 'no' | 'n/a';
  createdAt: string;
}

export function useAgentIdentities() {
  const { data: session } = useSession();
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = (session as { authToken?: string } | null)?.authToken;

  const fetchIdentities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/agent-identities`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Failed to fetch agent identities');
        setIsLoading(false);
        return;
      }
      setIdentities(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent identities');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  return { identities, isLoading, error, refetch: fetchIdentities };
}

export async function fetchAgentIdentity(id: string, token?: string): Promise<AgentIdentity> {
  const res = await fetch(`${API_URL}/api/agent-identities/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Agent identity not found');
  return res.json();
}

export async function fetchAgentAudit(agentId: string, token?: string): Promise<AgentAuditEvent[]> {
  const res = await fetch(`${API_URL}/api/agent-identities/audit?agentId=${encodeURIComponent(agentId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch audit');
  return res.json();
}
