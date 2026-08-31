import { apiClient, apiUrl } from '@/lib/apiClient';
import type {
  Grant,
  GrantDocument,
  GrantFormData,
  GrantStatus,
  GrantType,
  GrantFilters,
  JustificationTemplate,
  GrantsResponse,
  GrantResponse,
  PipelineStatsResponse,
  CalendarEventsResponse,
  FundingDiversification,
} from '@/types/grant';

const GRANT_API_URL = apiUrl('/api/grants');

async function grantRequest<T extends { success: boolean; error?: string }>(result: Awaited<ReturnType<typeof apiClient<T>>>): Promise<T> {
  if (!result.success) return { success: false, error: result.error } as T;
  return result.data;
}

export const grantApi = {
  getAll: async (filters?: GrantFilters): Promise<GrantsResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.deadlineWithin) params.append('deadlineWithin', filters.deadlineWithin.toString());
    const url = `${GRANT_API_URL}${params.toString() ? `?${params.toString()}` : ''}`;
    return grantRequest(await apiClient.get<GrantsResponse>(url));
  },

  getById: async (id: string): Promise<GrantResponse> => {
    return grantRequest(await apiClient.get<GrantResponse>(`${GRANT_API_URL}/${id}`));
  },

  create: async (data: GrantFormData): Promise<GrantResponse> => {
    return grantRequest(await apiClient.post<GrantResponse>(GRANT_API_URL, data));
  },

  update: async (id: string, data: Partial<GrantFormData>): Promise<GrantResponse> => {
    return grantRequest(await apiClient.put<GrantResponse>(`${GRANT_API_URL}/${id}`, data));
  },

  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return grantRequest(await apiClient.delete<{ success: boolean; error?: string }>(`${GRANT_API_URL}/${id}`));
  },

  updateStatus: async (id: string, status: GrantStatus): Promise<GrantResponse> => {
    return grantRequest(await apiClient.patch<GrantResponse>(`${GRANT_API_URL}/${id}/status`, { status }));
  },

  getPipelineStats: async (): Promise<PipelineStatsResponse> => {
    return grantRequest(await apiClient.get<PipelineStatsResponse>(`${GRANT_API_URL}/pipeline/stats`));
  },

  getFundingDiversification: async (): Promise<{ success: boolean; data?: FundingDiversification; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: FundingDiversification; error?: string }>(`${GRANT_API_URL}/funding/diversification`));
  },
};

export const grantDocumentApi = {
  getByGrantId: async (grantId: string): Promise<{ success: boolean; data?: GrantDocument[]; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: GrantDocument[]; error?: string }>(`${GRANT_API_URL}/${grantId}/documents`));
  },

  getByGrantIdAndType: async (grantId: string, type: GrantType): Promise<{ success: boolean; data?: GrantDocument[]; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: GrantDocument[]; error?: string }>(`${GRANT_API_URL}/${grantId}/documents/type/${type}`));
  },

  getLatestVersion: async (grantId: string, type: GrantType): Promise<{ success: boolean; data?: GrantDocument; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: GrantDocument; error?: string }>(`${GRANT_API_URL}/${grantId}/documents/type/${type}/latest`));
  },

  getVersionHistory: async (grantId: string, type: GrantType): Promise<{ success: boolean; data?: GrantDocument[]; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: GrantDocument[]; error?: string }>(`${GRANT_API_URL}/${grantId}/documents/type/${type}/history`));
  },

  upload: async (grantId: string, file: File, type: GrantDocument['type'], uploaded_by?: string): Promise<{ success: boolean; data?: GrantDocument; error?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (uploaded_by) formData.append('uploaded_by', uploaded_by);
    return grantRequest(await apiClient.postForm<{ success: boolean; data?: GrantDocument; error?: string }>(`${GRANT_API_URL}/${grantId}/documents`, formData));
  },

  download: async (id: string): Promise<Blob> => {
    const response = await fetch(`${GRANT_API_URL}/documents/${id}/download`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to download document');
    return response.blob();
  },

  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return grantRequest(await apiClient.delete<{ success: boolean; error?: string }>(`${GRANT_API_URL}/documents/${id}`));
  },
};

export const grantJustificationApi = {
  getRequirements: async (grantId: string): Promise<{ success: boolean; data?: JustificationTemplate; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: JustificationTemplate; error?: string }>(`${GRANT_API_URL}/${grantId}/justification/requirements`));
  },

  getStatus: async (grantId: string): Promise<{ success: boolean; data?: { is_ready: boolean; missing_documents: GrantDocument['type'][]; completed_documents: GrantDocument['type'][] }; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: { is_ready: boolean; missing_documents: GrantDocument['type'][]; completed_documents: GrantDocument['type'][] }; error?: string }>(`${GRANT_API_URL}/${grantId}/justification/status`));
  },

  markReady: async (grantId: string): Promise<GrantResponse> => {
    return grantRequest(await apiClient.post<GrantResponse>(`${GRANT_API_URL}/${grantId}/justification/ready`));
  },

  getTemplates: async (): Promise<{ success: boolean; data?: JustificationTemplate[]; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: JustificationTemplate[]; error?: string }>(`${GRANT_API_URL}/templates`));
  },

  getTemplateByType: async (type: GrantType): Promise<{ success: boolean; data?: JustificationTemplate; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: JustificationTemplate; error?: string }>(`${GRANT_API_URL}/templates/${type}`));
  },
};

export const grantCalendarApi = {
  getEvents: async (from: string, to: string): Promise<CalendarEventsResponse> => {
    return grantRequest(await apiClient.get<CalendarEventsResponse>(`${GRANT_API_URL}/calendar/events?from=${from}&to=${to}`));
  },

  getUpcomingDeadlines: async (within?: number): Promise<{ success: boolean; data?: Grant[]; error?: string }> => {
    const url = within ? `${GRANT_API_URL}/calendar/upcoming?within=${within}` : `${GRANT_API_URL}/calendar/upcoming`;
    return grantRequest(await apiClient.get<{ success: boolean; data?: Grant[]; error?: string }>(url));
  },

  getSummary: async (): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    return grantRequest(await apiClient.get<{ success: boolean; data?: unknown; error?: string }>(`${GRANT_API_URL}/calendar/summary`));
  },
};
