export type TenantStatus = "active" | "suspended" | "archived";

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  billing_status?: string | null;
  comped?: boolean;
  comped_end_date?: string | null;
  early_bird?: boolean;
  stripe_customer_id?: string | null;
  subscription_status?: string;
  allowed_email_domains?: string[];
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  chatbot_display_name?: string | null;
  feature_flags: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
}

export interface DashboardMetrics {
  total: number;
  counts: Record<TenantStatus, number>;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
}
