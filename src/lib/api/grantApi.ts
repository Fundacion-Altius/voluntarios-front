import { apiClient, apiUrl } from "/@/lib/apiClient";
import type {
  Grant,
  GrantDocument,
  GrantFormData,
  GrantStatus,
  GrantType,
  GrantFilters,
  GrantPipelineStats,
  GrantCalendarEvent,
  JustificationTemplate,
  JustificationStatus,
  GrantsResponse,
  GrantResponse,
  PipelineStatsResponse,
  CalendarEventsResponse,
} from "/@/types/grant";

// Base URL for grant API
const GRANT_API_URL = `${apiUrl}/api/grants`;

// Grant CRUD operations
export const grantApi = {
  // Get all grants with optional filters
  getAll: async (filters?: GrantFilters): Promise<GrantsResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.deadlineWithin) params.append("deadlineWithin", filters.deadlineWithin.toString());
    
    const url = `${GRANT_API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    return apiClient.get<GrantsResponse>(url);
  },

  // Get grant by ID
  getById: async (id: string): Promise<GrantResponse> => {
    return apiClient.get<GrantResponse>(`${GRANT_API_URL}/${id}`);
  },

  // Create new grant
  create: async (data: GrantFormData): Promise<GrantResponse> => {
    return apiClient.post<GrantResponse>(GRANT_API_URL, data);
  },

  // Update grant
  update: async (id: string, data: Partial<GrantFormData>): Promise<GrantResponse> => {
    return apiClient.put<GrantResponse>(`${GRANT_API_URL}/${id}`, data);
  },

  // Delete grant (soft delete)
  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return apiClient.delete<{ success: boolean; error?: string }>(`${GRANT_API_URL}/${id}`);
  },

  // Update grant status
  updateStatus: async (id: string, status: GrantStatus): Promise<GrantResponse> => {
    return apiClient.patch<GrantResponse>(`${GRANT_API_URL}/${id}/status`, { status });
  },

  // Get pipeline statistics
  getPipelineStats: async (): Promise<PipelineStatsResponse> => {
    return apiClient.get<PipelineStatsResponse>(`${GRANT_API_URL}/pipeline/stats`);
  },

  // Get funding diversification
  getFundingDiversification: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: any; error?: string }>(`${GRANT_API_URL}/funding/diversification`);
  },
};

// Document operations
export const grantDocumentApi = {
  // Get all documents for a grant
  getByGrantId: async (grantId: string): Promise<{ success: boolean; data?: GrantDocument[]; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: GrantDocument[]; error?: string }>(`${GRANT_API_URL}/${grantId}/documents`);
  },

  // Get documents by grant ID and type
  getByGrantIdAndType: async (grantId: string, type: GrantType): Promise<{ success: boolean; data?: GrantDocument[]; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: GrantDocument[]; error?: string }>(`${GRANT_API_URL}/${grantId}/documents/type/${type}`);
  },

  // Get latest version of a document type
  getLatestVersion: async (grantId: string, type: GrantType): Promise<{ success: boolean; data?: GrantDocument; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: GrantDocument; error?: string }>(`${GRANT_API_URL}/${grantId}/documents/type/${type}/latest`);
  },

  // Get version history
  getVersionHistory: async (grantId: string, type: GrantType): Promise<{ success: boolean; data?: GrantDocument[]; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: GrantDocument[]; error?: string }>(`${GRANT_API_URL}/${grantId}/documents/type/${type}/history`);
  },

  // Upload document
  upload: async (grantId: string, file: File, type: GrantType, uploaded_by?: string): Promise<{ success: boolean; data?: GrantDocument; error?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (uploaded_by) {
      formData.append("uploaded_by", uploaded_by);
    }

    return apiClient.postForm<{ success: boolean; data?: GrantDocument; error?: string }>(`${GRANT_API_URL}/${grantId}/documents`, formData);
  },

  // Download document
  download: async (id: string): Promise<Blob> => {
    const response = await fetch(`${GRANT_API_URL}/documents/${id}/download`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to download document");
    }
    
    return response.blob();
  },

  // Delete document
  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return apiClient.delete<{ success: boolean; error?: string }>(`${GRANT_API_URL}/documents/${id}`);
  },
};

// Justification operations
export const grantJustificationApi = {
  // Get justification requirements for a grant
  getRequirements: async (grantId: string): Promise<{ success: boolean; data?: JustificationTemplate; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: JustificationTemplate; error?: string }>(`${GRANT_API_URL}/${grantId}/justification/requirements`);
  },

  // Get justification status
  getStatus: async (grantId: string): Promise<{ success: boolean; data?: JustificationStatus; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: JustificationStatus; error?: string }>(`${GRANT_API_URL}/${grantId}/justification/status`);
  },

  // Mark justification as ready
  markReady: async (grantId: string): Promise<GrantResponse> => {
    return apiClient.post<GrantResponse>(`${GRANT_API_URL}/${grantId}/justification/ready`);
  },

  // Get all justification templates
  getTemplates: async (): Promise<{ success: boolean; data?: JustificationTemplate[]; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: JustificationTemplate[]; error?: string }>(`${GRANT_API_URL}/templates`);
  },

  // Get template by type
  getTemplateByType: async (type: GrantType): Promise<{ success: boolean; data?: JustificationTemplate; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: JustificationTemplate; error?: string }>(`${GRANT_API_URL}/templates/${type}`);
  },
};

// Calendar operations
export const grantCalendarApi = {
  // Get calendar events
  getEvents: async (from: string, to: string): Promise<CalendarEventsResponse> => {
    return apiClient.get<CalendarEventsResponse>(`${GRANT_API_URL}/calendar/events?from=${from}&to=${to}`);
  },

  // Get upcoming deadlines
  getUpcomingDeadlines: async (within?: number): Promise<{ success: boolean; data?: Grant[]; error?: string }> => {
    const url = within ? `${GRANT_API_URL}/calendar/upcoming?within=${within}` : `${GRANT_API_URL}/calendar/upcoming`;
    return apiClient.get<{ success: boolean; data?: Grant[]; error?: string }>(url);
  },

  // Get calendar summary
  getSummary: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    return apiClient.get<{ success: boolean; data?: any; error?: string }>(`${GRANT_API_URL}/calendar/summary`);
  },
};