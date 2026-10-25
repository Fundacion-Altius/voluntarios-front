// Landing features copy (Adela, 24 oct 2026) now lives in messages/{es,ca,en}.json
// under klaruk.features.groups. Source: klaruk-landing/features-copy-2026-10-24.md
// No feature is tied to a plan. OPTIONAL: "Banco de alimentos" is item "3" of
// group 2 in each locale; to drop it, delete that item in all three files.
export type FeatureGroup = { title: string; benefit: string; items: string[] };
