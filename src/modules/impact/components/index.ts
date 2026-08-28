/**
 * Impact Report Components Index
 * 
 * Exports all frontend components for the funder impact reporting module.
 */

export { EvidencePicker } from './EvidencePicker';
export type { EvidencePickerProps } from '../impactReportTypes';

export { ReportReview } from './ReportReview';
export type { ReportReviewProps } from '../impactReportTypes';

export { TimeTrackingWidget } from './TimeTrackingWidget';
export type { TimeTrackingWidgetProps } from '../impactReportTypes';

// Export types
export type {
  ReportStatus,
  FunderType,
  ReportPeriod,
  EvidenceType,
  EvidenceCatalogEntry,
  Evidence,
  TemplateSection,
  ReportTemplate,
  ReportSection,
  CustomSection,
  OperationalData,
  ExecutiveSummary,
  ImpactReport,
  ReportVersion,
  ActivityType,
  JustificationTimeEntry,
  JustificationTimeMetrics,
  MonthlyComparison,
  GenerateReportRequest,
  GenerateReportResponse,
  UpdateReportStatusRequest,
  AddEvidenceRequest,
  StartTimeTrackingRequest,
  StopTimeTrackingRequest,
  ListResponse,
  SingleResponse,
} from '../impactReportTypes';
