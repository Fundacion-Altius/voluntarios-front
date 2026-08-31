// Grant types for frontend
export type GrantStatus = "identified" | "applied" | "approved" | "rejected" | "received" | "justified";
export type GrantType = "public" | "private" | "EU";
export type GrantDocumentType = "application" | "justification" | "report" | "receipt" | "other";

export interface Grant {
  id: string;
  name: string;
  funding_body: string;
  type: GrantType;
  amount: number;
  status: GrantStatus;
  application_date?: string;
  deadline?: string;
  resolution_date?: string;
  justification_requirements?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface GrantDocument {
  id: string;
  grant_id: string;
  filename: string;
  type: GrantDocumentType;
  version: number;
  uploaded_by?: string;
  file_path: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface GrantWithDocuments extends Grant {
  documents: GrantDocument[];
}

// Pipeline stats
export interface GrantPipelineStats {
  total: number;
  byStatus: Record<GrantStatus, number>;
  byType: Record<GrantType, number>;
  totalPipelineValue: number;
  approvalRate: number;
}

// Funding diversification
export interface FundingDiversification {
  public: number;
  private: number;
  EU: number;
}

// Calendar event
export interface GrantCalendarEvent {
  id: string;
  grant_id: string;
  grant_name: string;
  grant_type: GrantType;
  deadline: string;
  event_type: "application_deadline" | "justification_deadline" | "reporting_deadline";
  is_overdue: boolean;
  days_until_deadline?: number;
}

// Justification template
export interface JustificationTemplate {
  grant_type: GrantType;
  required_documents: GrantDocumentType[];
  description?: string;
}

// Justification status
export interface JustificationStatus {
  grant_id: string;
  required_documents: GrantDocumentType[];
  completed_documents: GrantDocumentType[];
  missing_documents: GrantDocumentType[];
  is_ready: boolean;
}

// API response types
export interface GrantsResponse {
  success: boolean;
  data?: Grant[];
  error?: string;
}

export interface GrantResponse {
  success: boolean;
  data?: Grant;
  error?: string;
}

export interface PipelineStatsResponse {
  success: boolean;
  data?: GrantPipelineStats;
  error?: string;
}

export interface CalendarEventsResponse {
  success: boolean;
  data?: GrantCalendarEvent[];
  error?: string;
}

// Filter types
export interface GrantFilters {
  status?: GrantStatus;
  type?: GrantType;
  deadlineWithin?: number;
  search?: string;
}

// Form types
export interface GrantFormData {
  name: string;
  funding_body: string;
  type: GrantType;
  amount: number;
  application_date?: string;
  deadline?: string;
  resolution_date?: string;
  justification_requirements?: string;
}

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<GrantStatus, GrantStatus[]> = {
  identified: ["applied"],
  applied: ["approved", "rejected"],
  approved: ["received"],
  rejected: [],
  received: ["justified"],
  justified: [],
};

// Status colors for UI
export const STATUS_COLORS: Record<GrantStatus, string> = {
  identified: "bg-blue-100 text-blue-800",
  applied: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  received: "bg-purple-100 text-purple-800",
  justified: "bg-gray-100 text-gray-800",
};

// Status labels for UI
export const STATUS_LABELS: Record<GrantStatus, string> = {
  identified: "Identificado",
  applied: "Solicitado",
  approved: "Aprobado",
  rejected: "Rechazado",
  received: "Recibido",
  justified: "Justificado",
};

// Type labels for UI
export const TYPE_LABELS: Record<GrantType, string> = {
  public: "Pública",
  private: "Privada",
  EU: "UE",
};