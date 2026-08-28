/**
 * Impact KPI types for the frontend.
 * Mirrors the backend types from voluntarios-back/src/modules/impact/domain/impactKpi.ts
 */

export type ImpactKpiKey =
  | "volunteer_hours_total"
  | "people_served_estimated"
  | "volunteer_retention_rate"
  | "community_satisfaction"
  | "volunteer_growth_rate";

export const ALL_IMPACT_KPI_KEYS: readonly ImpactKpiKey[] = [
  "volunteer_hours_total",
  "people_served_estimated",
  "volunteer_retention_rate",
  "community_satisfaction",
  "volunteer_growth_rate",
] as const;

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
