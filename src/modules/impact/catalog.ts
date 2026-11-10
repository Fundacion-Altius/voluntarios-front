export type ImpactSourceType = 'automatic' | 'semiautomatic' | 'entity_provided';
export type ImpactLayer = 'outcome' | 'operation' | 'network';
export type ImpactFgpsScope = 'entity' | 'project';
export type ImpactGuidedProfile = 'direct_care' | 'volunteering' | 'advocacy' | 'network';

export type ImpactCatalogItem = {
  key: string;
  layer: ImpactLayer;
  sourceType: ImpactSourceType;
  fgpsScope?: ImpactFgpsScope;
  mapsToKpi?: string;
  unit: string;
  profiles: readonly ImpactGuidedProfile[];
};

export type ImpactIndicatorSelection = {
  key: string;
  showOnPublicPage: boolean;
  manualValue?: number | null;
  manualUnit?: string;
  evidence?: string;
  isEstimate?: boolean;
};

export type TenantImpactConfig = {
  tenantId: string;
  organizationName: string;
  organizationLogo: string;
  showEstimateBadge: boolean;
  peoplePerHourFactor: number;
  guidedCompleted: boolean;
  selected: ImpactIndicatorSelection[];
  publicHeadline?: string;
  publicCtaText?: string;
  updatedAt: string;
};

export type PublicImpactFigure = {
  key: string;
  showOnPublicPage: true;
  manualValue?: number | null;
  manualUnit?: string;
  isEstimate?: boolean;
};

export type PublicImpactConfig = {
  organizationName: string;
  organizationLogo: string;
  showEstimateBadge: boolean;
  publicHeadline?: string;
  publicCtaText?: string;
  publicKeys: string[];
  figures: PublicImpactFigure[];
};

/** Fallback catalog (UI labels come from i18n). Kept in sync with back IMPACT_CATALOG. */
export const IMPACT_CATALOG: readonly ImpactCatalogItem[] = [
  { key: 'families_served_weekly', layer: 'outcome', sourceType: 'automatic', mapsToKpi: 'people_served_estimated', unit: 'families', profiles: ['direct_care'] },
  { key: 'feel_less_alone', layer: 'outcome', sourceType: 'semiautomatic', mapsToKpi: 'community_satisfaction', unit: 'score', profiles: ['direct_care', 'advocacy'] },
  { key: 'volunteer_hours', layer: 'operation', sourceType: 'automatic', mapsToKpi: 'volunteer_hours_total', unit: 'hours', profiles: ['volunteering', 'direct_care'] },
  { key: 'shift_coverage', layer: 'operation', sourceType: 'automatic', mapsToKpi: 'coverage_rate', unit: '%', profiles: ['volunteering'] },
  { key: 'shift_reliability', layer: 'operation', sourceType: 'automatic', mapsToKpi: 'reliability_rate', unit: '%', profiles: ['volunteering'] },
  { key: 'volunteer_retention', layer: 'operation', sourceType: 'automatic', mapsToKpi: 'volunteer_retention_rate', unit: '%', profiles: ['volunteering'] },
  { key: 'network_participation', layer: 'network', sourceType: 'entity_provided', fgpsScope: 'entity', unit: 'entities', profiles: ['network', 'advocacy'] },
  { key: 'social_base_volume', layer: 'network', sourceType: 'automatic', fgpsScope: 'entity', mapsToKpi: 'volunteer_growth_rate', unit: 'members', profiles: ['network', 'advocacy'] },
  { key: 'project_volunteering', layer: 'operation', sourceType: 'automatic', fgpsScope: 'project', mapsToKpi: 'volunteer_hours_total', unit: 'hours', profiles: ['volunteering', 'direct_care'] },
  { key: 'user_design_participation', layer: 'outcome', sourceType: 'semiautomatic', fgpsScope: 'project', unit: 'participants', profiles: ['direct_care', 'advocacy'] },
  { key: 'social_return', layer: 'outcome', sourceType: 'entity_provided', unit: 'currency', profiles: ['advocacy', 'network'] },
  { key: 'onboarding_completion', layer: 'operation', sourceType: 'automatic', mapsToKpi: 'onboarding_completion_rate', unit: '%', profiles: ['volunteering'] },
  { key: 'time_to_fill', layer: 'operation', sourceType: 'automatic', mapsToKpi: 'time_to_fill', unit: 'days', profiles: ['volunteering'] },
  { key: 'social_impact_per_hour', layer: 'outcome', sourceType: 'automatic', mapsToKpi: 'social_impact_per_hour', unit: 'people/hour', profiles: ['direct_care', 'volunteering'] },
  // fundacionaltius-only (served by the back for that tenant)
  { key: 'basic_needs_people', layer: 'outcome', sourceType: 'entity_provided', unit: 'people', profiles: ['direct_care'] },
  { key: 'food_kilos_delivered', layer: 'outcome', sourceType: 'entity_provided', unit: 'kg', profiles: ['direct_care'] },
  { key: 'social_integration_people', layer: 'outcome', sourceType: 'entity_provided', unit: 'people', profiles: ['direct_care', 'advocacy'] },
  { key: 'course_students', layer: 'outcome', sourceType: 'entity_provided', unit: 'students', profiles: ['direct_care'] },
  { key: 'insertion_itineraries_people', layer: 'outcome', sourceType: 'entity_provided', unit: 'people', profiles: ['direct_care'] },
  { key: 'volunteers_supporting', layer: 'operation', sourceType: 'entity_provided', unit: 'volunteers', profiles: ['volunteering'] },
] as const;

export function getCatalogItem(key: string): ImpactCatalogItem | undefined {
  return IMPACT_CATALOG.find((i) => i.key === key);
}

export function suggestForProfiles(
  profiles: readonly ImpactGuidedProfile[],
  limit = 5,
): ImpactCatalogItem[] {
  if (profiles.length === 0) {
    return IMPACT_CATALOG.filter((i) => i.profiles.includes('direct_care')).slice(0, limit);
  }
  return [...IMPACT_CATALOG]
    .map((item) => ({
      item,
      score: item.profiles.filter((p) => profiles.includes(p)).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.key.localeCompare(b.item.key))
    .slice(0, limit)
    .map((s) => s.item);
}

export type ImpactAdminView =
  | 'home'
  | 'library-start'
  | 'library-mine'
  | 'library-add'
  | 'library-setup'
  | 'editor'
  | 'paths';
