'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { useSession } from 'next-auth/react';
import type { AutomationMetricsView, ManualTaskView } from './components/AutomationWorkloadWidget';

const API_URL = getApiBaseUrl();

export function useAutomationWorkload() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<AutomationMetricsView | null>(null);
  const [manualTasks, setManualTasks] = useState<ManualTaskView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = (session as { authToken?: string } | null)?.authToken;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    setIsLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/automation/metrics`, { headers, credentials: 'include' }).then((res) => res.json()),
      fetch(`${API_URL}/api/automation/manual-tasks`, { headers, credentials: 'include' }).then((res) => res.json()),
    ])
      .then(([metricsBody, manualBody]) => {
        setMetrics(metricsBody);
        setManualTasks(manualBody.tasks ?? []);
      })
      .catch(() => {
        setMetrics(null);
        setManualTasks([]);
      })
      .finally(() => setIsLoading(false));
  }, [session]);

  return { metrics, manualTasks, isLoading };
}
