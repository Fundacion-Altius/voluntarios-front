import { apiClient, apiUrl } from '@/lib/apiClient';

export interface FundOpportunity {
  id: string;
  name: string;
  funding_body: string;
  type: string;
  sector_tags: string;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  eligibility_criteria: string | null;
  application_url: string | null;
  description: string | null;
  scope?: string | null;
  listing_status?: string | null;
  last_updated: string;
  created_at: string;
  outdated?: boolean;
}

export interface FundOpportunityFilters {
  q?: string;
  type?: string;
  sector?: string;
  scope?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  includeExpired?: boolean;
}

export interface CallSyncResult {
  imported: number;
  skipped: number;
  expired: number;
  warning?: string;
}

export interface CallSyncStatus {
  enabled: boolean;
  lastRunAt: string | null;
  lastResult: CallSyncResult | null;
}

const FUND_API_URL = apiUrl('/api/fund-opportunities');

export function buildFundOpportunityQuery(filters: FundOpportunityFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.sector) params.set('sector', filters.sector);
  if (filters.scope) params.set('scope', filters.scope);
  if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom);
  if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo);
  if (filters.includeExpired) params.set('includeExpired', '1');
  return params.toString();
}

export const fundOpportunityApi = {
  list: (filters?: FundOpportunityFilters) =>
    apiClient.get<FundOpportunity[]>(`${FUND_API_URL}?${buildFundOpportunityQuery(filters)}`),

  getById: (id: string) => apiClient.get<FundOpportunity>(`${FUND_API_URL}/${id}`),

  apply: (id: string) => apiClient.post<{ id: string }>(`${FUND_API_URL}/${id}/apply`),

  sync: () => apiClient.post<CallSyncResult>(`${FUND_API_URL}/sync`),

  getSyncStatus: () => apiClient.get<CallSyncStatus>(`${FUND_API_URL}/sync/status`),
};

export const grantReminderSettingsApi = {
  get: () => apiClient.get<{ leadDays: number[] }>(apiUrl('/api/automation/grant-reminder-settings')),

  update: (leadDays: number[]) =>
    apiClient.put<{ leadDays: number[] }>(apiUrl('/api/automation/grant-reminder-settings'), { leadDays }),
};
