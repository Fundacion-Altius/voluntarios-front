/** Canonical age-band order (keys match the backend AgeBand union). */
export const AGE_BANDS = ['under_1', 'y1_2', 'y3_4', 'y5_7', 'y8_11', 'y12_14', 'older'] as const;

export type AgeBandKey = (typeof AGE_BANDS)[number];
