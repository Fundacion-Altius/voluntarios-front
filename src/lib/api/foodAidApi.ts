/**
 * Food-aid API client for the portal.
 *
 * ENDPOINT CONTRACT (inferred from the backend module — see the report)
 * --------------------------------------------------------------
 * The backend food-aid module currently exposes NO HTTP router. It only ships
 * domain types, an in-memory store and two Drizzle repositories:
 *   voluntarios-back/src/modules/food-aid/types.ts
 *   voluntarios-back/src/modules/food-aid/store.ts
 *   voluntarios-back/src/modules/food-aid/itemsRepository.ts
 *   voluntarioos-back/src/modules/food-aid/lotsRepository.ts
 *
 * The paths below mirror that module's own operation names
 * (listItems/addItem/listLots/addLot/updateLot) and the mount pattern of the
 * closest existing analog, the toys module:
 *   src/api/routes/index.ts:82  ->  router.use("/toys", toysRoutes)
 *   src/api/routes/toysRoutes.ts:62,82  ->  "/items", POST "/items"
 *   src/api/controllers/toysController.ts:124 -> res.json(items)  (bare array)
 *   src/api/controllers/toysController.ts:147 -> res.status(201).json(created)
 *
 * So the food-aid routes are expected to be mounted as /api/food-aid and to
 * answer with a bare array (list) / bare object (create, patch) or with a
 * { data } envelope. Both shapes are accepted below.
 *
 * TENANT SCOPING
 * --------------
 * No tenant id is ever sent from the browser. The backend resolves the tenant
 * from the request host (src/middleware/tenantResolver.ts:24) and the Next.js
 * proxy forwards the browser host as x-forwarded-host
 * (src/app/api/[...path]/route.ts:16).
 */

import { apiUrl } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { getAuthToken, getCSRFToken } from '@/app/lib/csrf';
import type {
  FoodAidItem,
  FoodAidItemInput,
  FoodAidLot,
  FoodAidLotInput,
  FoodAidLotWithItem,
} from '@/types/foodAid';

const FOOD_AID_API_URL = apiUrl('/api/food-aid');

/**
 * Why the call failed. `not_found` means the route is missing (404) — the
 * backend has no food-aid router yet. `unavailable` covers 401/403/500/503,
 * which is what a missing table or a rejected tenant produces.
 */
export type FoodAidApiErrorKind = 'not_found' | 'unavailable' | 'validation' | 'unknown';

export interface FoodAidApiFailure {
  success: false;
  kind: FoodAidApiErrorKind;
  /** Machine-readable reason, so the UI can pick a translated message. */
  code: FoodAidApiErrorCode;
  /** Raw message from the backend, when it sent one. */
  error: string;
  status?: number;
}

/**
 * Why a call failed, independent of the HTTP status.
 * - `service_unavailable`: the route or the service could not answer.
 * - `validation`: the backend rejected the payload; its message is useful.
 * - `invalid_response`: the answer did not match the expected shape.
 * - `network`: the request never reached the server.
 */
export type FoodAidApiErrorCode =
  | 'service_unavailable'
  | 'validation'
  | 'invalid_response'
  | 'network';

export type FoodAidApiResult<T> = { success: true; data: T } | FoodAidApiFailure;

export function classifyFoodAidError(status: number): FoodAidApiErrorKind {
  if (status === 404) return 'not_found';
  if (status === 400 || status === 409 || status === 422) return 'validation';
  if (status === 401 || status === 403 || status === 500 || status === 503) return 'unavailable';
  return 'unknown';
}

/** The message the backend sent, or an empty string when it sent none. */
function backendMessage(body: { error?: string; message?: string }): string {
  return body.message || body.error || '';
}

/** The backend may answer with a bare array or with a { data } envelope. */
function toArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

/** The backend may answer with a bare object or with a { data } envelope. */
function toObject<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  if ('data' in payload && (payload as { data: unknown }).data && typeof (payload as { data: unknown }).data === 'object') {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

/** Fetch a CSRF cookie for mutating requests, like src/lib/apiClient.ts:21. */
async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === 'undefined' || getCSRFToken()) return;
  await fetch(`${getApiBaseUrl()}/api/csrf-token`, { credentials: 'include' }).catch(() => undefined);
}

/** Auth + CSRF + JSON headers, like src/lib/apiClient.ts:26. */
function buildHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const csrf = getCSRFToken();
  if (csrf && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrf);
  }
  const auth = getAuthToken();
  if (auth && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${auth}`);
  }
  return headers;
}

/** The backend reports failures as { error } or { message }. */
async function readErrorBody(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  return body.message || body.error || `Request failed with status ${res.status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<FoodAidApiResult<T>> {
  const method = (init?.method ?? 'GET').toUpperCase();
  try {
    if (!isSafeMethod(method)) {
      await ensureCsrfCookie();
    }

    const res = await fetch(`${FOOD_AID_API_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: buildHeaders(init),
    });

    if (!res.ok) {
      const kind = classifyFoodAidError(res.status);
      return {
        success: false,
        kind,
        code: kind === 'validation' ? 'validation' : 'service_unavailable',
        error: await readErrorBody(res),
        status: res.status,
      };
    }

    if (res.status === 204) {
      return { success: true, data: null as T };
    }

    const data = (await res.json().catch(() => null)) as T | null;
    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      kind: 'unknown',
      code: 'network',
      error: error instanceof Error ? error.message : '',
    };
  }
}

export const foodAidApi = {
  async listItems(): Promise<FoodAidApiResult<FoodAidItem[]>> {
    const result = await request<unknown>('/items');
    if (!result.success) return result;
    return { success: true, data: toArray<FoodAidItem>(result.data) };
  },

  async createItem(input: FoodAidItemInput): Promise<FoodAidApiResult<FoodAidItem>> {
    const result = await request<unknown>('/items', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!result.success) return result;
    const item = toObject<FoodAidItem>(result.data);
    if (!item) {
      return { success: false, kind: 'unknown', code: 'invalid_response', error: '' };
    }
    return { success: true, data: item };
  },

  async listLots(): Promise<FoodAidApiResult<FoodAidLot[]>> {
    const result = await request<unknown>('/lots');
    if (!result.success) return result;
    return { success: true, data: toArray<FoodAidLot>(result.data) };
  },

  async createLot(input: FoodAidLotInput): Promise<FoodAidApiResult<FoodAidLot>> {
    const result = await request<unknown>('/lots', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!result.success) return result;
    const lot = toObject<FoodAidLot>(result.data);
    if (!lot) {
      return { success: false, kind: 'unknown', code: 'invalid_response', error: '' };
    }
    return { success: true, data: lot };
  },

  async updateLot(
    id: string,
    patch: Partial<FoodAidLotInput>
  ): Promise<FoodAidApiResult<FoodAidLot>> {
    const result = await request<unknown>(`/lots/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!result.success) return result;
    const lot = toObject<FoodAidLot>(result.data);
    if (!lot) {
      return { success: false, kind: 'unknown', code: 'invalid_response', error: '' };
    }
    return { success: true, data: lot };
  },

  async deleteLot(id: string): Promise<FoodAidApiResult<null>> {
    const result = await request<unknown>(`/lots/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!result.success) return result;
    return { success: true, data: null };
  },

  async listExpiringLots(): Promise<FoodAidApiResult<FoodAidLot[]>> {
    const result = await request<unknown>('/lots/expiring');
    if (!result.success) return result;
    return { success: true, data: toArray<FoodAidLot>(result.data) };
  },

  async notifyExpiringLots(): Promise<FoodAidApiResult<{ notified: boolean; count: number }>> {
    const result = await request<unknown>('/lots/expiring/notify', { method: 'POST', body: '{}' });
    if (!result.success) return result;
    const data = toObject<{ notified: boolean; count: number }>(result.data);
    if (!data) {
      return { success: false, kind: 'unknown', code: 'invalid_response', error: '' };
    }
    return { success: true, data };
  },
};

/** Join lots with their item so the list can show title, unit and category. */
export function joinLotsWithItems(
  lots: FoodAidLot[],
  items: FoodAidItem[]
): FoodAidLotWithItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return lots.map((lot) => ({ ...lot, item: byId.get(lot.item_id) ?? null }));
}
