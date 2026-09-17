/**
 * Impact KPI types for the frontend.
 * Mirrors the backend types from voluntarios-back/src/modules/impact/domain/impactKpi.ts
 */

export type ImpactKpiKey =
  | "volunteer_hours_total"
  | "people_served_estimated"
  | "community_satisfaction"
  | "volunteer_retention_rate"
  | "volunteer_churn_rate"
  | "volunteer_growth_rate"
  | "coverage_rate"
  | "time_to_fill"
  | "reliability_rate"
  | "onboarding_completion_rate"
  | "social_impact_per_hour"
  | "volunteer_nps";

export const ALL_IMPACT_KPI_KEYS: readonly ImpactKpiKey[] = [
  "volunteer_hours_total",
  "people_served_estimated",
  "community_satisfaction",
  "volunteer_retention_rate",
  "volunteer_churn_rate",
  "volunteer_growth_rate",
  "coverage_rate",
  "time_to_fill",
  "reliability_rate",
  "onboarding_completion_rate",
  "social_impact_per_hour",
  "volunteer_nps",
] as const;

/**
 * The 8 coordinator KPIs shown in the admin dashboard top section, in order.
 * Backend omits volunteer_nps while no 0-10 recommendation survey exists;
 * the grid renders it as an empty-state card.
 */
export const COORDINATOR_KPI_ORDER: readonly ImpactKpiKey[] = [
  "coverage_rate",
  "reliability_rate",
  "volunteer_churn_rate",
  "volunteer_retention_rate",
  "time_to_fill",
  "onboarding_completion_rate",
  "social_impact_per_hour",
  "volunteer_nps",
] as const;

/** Legacy public-dashboard order, kept for reference and tests. */
export const PUBLIC_KPI_ORDER: readonly ImpactKpiKey[] = [
  "volunteer_hours_total",
  "people_served_estimated",
  "community_satisfaction",
  "volunteer_retention_rate",
  "volunteer_churn_rate",
  "volunteer_growth_rate",
  "coverage_rate",
  "time_to_fill",
] as const;

export type ImpactTrendDirection = "up" | "down" | "stable";

export type ImpactTrendSummary = {
  direction: ImpactTrendDirection;
  percentChange: number;
};

export type ImpactKpi = {
  key: ImpactKpiKey;
  value: number;
  period: string;
  isEstimate: boolean;
  unit: string;
};

export type ImpactKpiResponse = {
  success: boolean;
  data?: ImpactKpi[];
  period?: string;
  tenantId?: string;
  timestamp?: string;
  error?: string;
  details?: unknown;
};

// Communication Generator Types
export type SocialMediaPlatform = "twitter" | "linkedin" | "instagram";

export type SocialMediaCardInput = {
  platform: SocialMediaPlatform;
  period?: string;
  tenantId?: string;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
};

export type SocialMediaCardOutput = {
  image: string;
  mimeType: "image/png" | "application/json";
  size: number;
  filename: string;
  platform: SocialMediaPlatform;
};

export type AnnualReportInput = {
  period?: string;
  tenantId?: string;
  organizationName?: string;
  introduction?: string;
  conclusion?: string;
};

export type AnnualReportOutput = {
  text: string;
  wordCount: number;
  characterCount: number;
};

export type PressReleaseInput = {
  period?: string;
  tenantId?: string;
  organizationName?: string;
  milestone?: string;
  contactEmail?: string;
  contactPhone?: string;
  releaseDate?: string;
};

export type PressReleaseOutput = {
  text: string;
  title: string;
  subtitle: string;
  body: string[];
  boilerplate: string;
  contactInfo: string;
  wordCount: number;
};

export type CommunicationTemplateConfig = {
  tenantId: string;
  organizationName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily?: string;
  socialMediaTitleTemplate?: string;
  socialMediaSubtitleTemplate?: string;
  annualReportIntroTemplate?: string;
  annualReportConclusionTemplate?: string;
  pressReleaseTitleTemplate?: string;
  pressContactEmail: string;
  pressContactPhone?: string;
};

export type CommunicationResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
};
