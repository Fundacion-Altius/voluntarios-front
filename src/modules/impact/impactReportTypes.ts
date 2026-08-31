/**
 * Impact Report Types for Funder Impact Reporting
 * Frontend types that mirror the backend impact report domain
 */

import type { ImpactKpi } from './types';

// ============================================================================
// Report Types and Status
// ============================================================================

export type ReportStatus = "draft" | "review" | "approved" | "submitted" | "rejected";

export type FunderType = "public" | "private" | "eu";

// ============================================================================
// Report Period
// ============================================================================

export interface ReportPeriod {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  periodType: "quarterly" | "monthly" | "yearly" | "custom";
  label: string; // e.g., "2026-Q1", "January 2026"
}

// ============================================================================
// Evidence Types
// ============================================================================

export type EvidenceType =
  | "document"
  | "image"
  | "certificate"
  | "survey_result"
  | "contract_summary"
  | "member_statistics";

export interface EvidenceCatalogEntry {
  id: string;
  name: string;
  type: EvidenceType;
  description: string;
  source: string;
  createdAt: string;
  createdBy: string;
  tags: string[];
  fileInfo: {
    url: string;
    mimeType: string;
    size: number;
  };
}

export interface Evidence {
  id: string;
  name: string;
  type: EvidenceType;
  description?: string;
  fileUrl: string;
  filePath?: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  reportId?: string;
  sectionId?: string;
  tags: string[];
}

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateSection {
  id: string;
  title: string;
  type: string;
  isRequired: boolean;
  order: number;
  dataFields: string[];
  description?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  funderType: FunderType;
  description: string;
  version: string;
  sections: TemplateSection[];
  requiredData: string[];
  supportedFormats: ("pdf" | "docx")[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Report Section Types
// ============================================================================

export interface ReportSection {
  id: string;
  title: string;
  type:
    | "executive_summary"
    | "volunteer_activity"
    | "community_outcomes"
    | "financial_summary"
    | "testimonials"
    | "custom";
  content: string;
  order: number;
  isRequired: boolean;
  dataSource?: string;
  metadata?: Record<string, unknown>;
}

export interface CustomSection extends ReportSection {
  type: "custom";
  customType?: string;
  templateId?: string;
}

// ============================================================================
// Operational Data
// ============================================================================

export interface OperationalData {
  kpis: ImpactKpi[];
  volunteerData: {
    totalHours: number;
    activeVolunteers: number;
    newVolunteers: number;
    retentionRate: number;
    growthRate: number;
  };
  contractData: {
    totalContracts: number;
    completedContracts: number;
    inProgressContracts: number;
    totalValue: number;
  };
  surveyData: {
    totalSurveys: number;
    averageSatisfaction: number;
    responseCount: number;
    feedbackSummary: string[];
  };
  memberData: {
    totalMembers: number;
    activeMembers: number;
    newMembers: number;
    contributionTotal: number;
  };
  financialData: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    fundingSources: Record<string, number>;
  };
  testimonials: string[];
}

export interface ExecutiveSummary {
  title: string;
  period: string;
  keyAchievements: string[];
  keyMetrics: Record<string, string>;
  highlights: string[];
  challenges: string[];
  outlook: string;
}

// ============================================================================
// Main Impact Report Type
// ============================================================================

export interface ImpactReport {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  funderId?: string;
  funderType: FunderType;
  period: ReportPeriod;
  status: ReportStatus;
  authorId: string;
  authorName: string;
  reviewerId?: string;
  reviewerName?: string;
  sections: ReportSection[];
  executiveSummary: ExecutiveSummary;
  operationalData: OperationalData;
  evidenceIds: string[];
  customSections: CustomSection[];
  version: number;
  versionHistory: ReportVersion[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionComments?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportVersion {
  version: number;
  reportId: string;
  contentSnapshot: Partial<ImpactReport>;
  changedBy: string;
  changeDescription: string;
  timestamp: string;
}

// ============================================================================
// Time Tracking Types
// ============================================================================

export type ActivityType = "report_creation" | "evidence_collection" | "review" | "revision" | "submission";

export interface JustificationTimeEntry {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  activityType: ActivityType;
  description?: string;
  isActive: boolean;
}

export interface JustificationTimeMetrics {
  reportId: string;
  totalTimeSeconds: number;
  timeByActivity: Record<string, number>;
  timeByUser: Record<string, number>;
  averageTimePerReport: number;
  trend: "improving" | "stable" | "worsening";
  trendPercentage: number;
}

export interface MonthlyComparison {
  currentMonth: JustificationTimeMetrics;
  previousMonth: JustificationTimeMetrics;
  improvementPercentage: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GenerateReportRequest {
  name: string;
  description?: string;
  templateId: string;
  funderId?: string;
  funderType: FunderType;
  period: ReportPeriod;
  customSections?: Omit<CustomSection, "id" | "order">[];
  includeEvidence?: boolean;
}

export interface GenerateReportResponse {
  success: boolean;
  data?: ImpactReport;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  comments?: string;
}

export interface AddEvidenceRequest {
  evidenceId: string;
  sectionId?: string;
  description?: string;
}

export interface StartTimeTrackingRequest {
  reportId: string;
  userId: string;
  activityType: ActivityType;
  description?: string;
}

export interface StopTimeTrackingRequest {
  description?: string;
}

// ============================================================================
// List Responses
// ============================================================================

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
  details?: unknown;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  details?: unknown;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface EvidencePickerProps {
  reportId: string;
  onEvidenceSelected: (evidence: EvidenceCatalogEntry) => void;
  selectedEvidenceIds?: string[];
  sectionId?: string;
}

export interface ReportReviewProps {
  report: ImpactReport;
  onApprove: (reportId: string, comments?: string) => Promise<void>;
  onReject: (reportId: string, comments: string) => Promise<void>;
  onStatusChange: (reportId: string, newStatus: ReportStatus) => Promise<void>;
  currentUserId: string;
}

export interface TimeTrackingWidgetProps {
  reportId: string;
  userId: string;
  onTimerStart: (activityType: ActivityType) => Promise<void>;
  onTimerStop: () => Promise<void>;
  showMetrics?: boolean;
}
