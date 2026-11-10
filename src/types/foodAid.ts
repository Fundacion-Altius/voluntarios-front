/**
 * Food-aid types for the frontend.
 * Mirrors the backend types from
 * voluntarios-back/src/modules/food-aid/types.ts
 * and the DB shape in
 * voluntarios-back/src/db/schema/pg/food-aid.ts
 *
 * Note: the food-aid tables deliberately hold no beneficiary data
 * (src/db/schema/pg/food-aid.ts:8-11), so there is no beneficiary link here.
 */

/**
 * Triage status of a food-aid lot. The backend column is a free varchar(20)
 * defaulting to "accepted"; these are the values the backend documents
 * (src/modules/food-aid/types.ts:47 and src/db/schema/pg/food-aid.ts:64).
 */
export const FOOD_AID_LOT_STATUSES = ["accepted", "partial", "rejected"] as const;
export type FoodAidLotStatus = (typeof FOOD_AID_LOT_STATUSES)[number];

/**
 * Category used for triage. The backend column is a free varchar(50); these
 * are the values the backend documents
 * (src/db/schema/pg/food-aid.ts:26 and src/modules/food-aid/types.ts:20).
 */
export const FOOD_AID_CATEGORIES = [
  "food",
  "hygiene",
  "diapers",
  "toys",
  "kitchenware",
] as const;
export type FoodAidCategory = (typeof FOOD_AID_CATEGORIES)[number];

/**
 * Unit of measurement. The backend column is a free varchar(20) defaulting to
 * "unit" (src/db/schema/pg/food-aid.ts:29).
 */
export const FOOD_AID_UNITS = ["kg", "g", "L", "ml", "unit"] as const;
export type FoodAidUnit = (typeof FOOD_AID_UNITS)[number];

/** A food-aid item definition (generic; never holds beneficiary data). */
export interface FoodAidItem {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category: string;
  unit: string;
  ean: string | null;
  pictures: string[];
  cover: string | null;
  created_at: string;
  updated_at: string;
}

/** A lot of a food-aid item: quantity, expiry, location and triage status. */
export interface FoodAidLot {
  id: string;
  tenant_id: string;
  item_id: string;
  quantity: number;
  expiry_date: string | null;
  location: string;
  received_at: string;
  status: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Body accepted by the backend when creating a food-aid item. */
export interface FoodAidItemInput {
  title: string;
  description: string | null;
  category: string;
  unit: string;
  ean: string | null;
  pictures?: string[];
  cover?: string | null;
}

/** Body accepted by the backend when creating a food-aid lot. */
export interface FoodAidLotInput {
  item_id: string;
  quantity: number;
  expiry_date: string | null;
  location: string;
  received_at?: string;
  status?: string;
}

/**
 * A lot joined with the item it refers to. The backend exposes lots and items
 * separately, so the portal joins them for display.
 */
export interface FoodAidLotWithItem extends FoodAidLot {
  item: FoodAidItem | null;
}
