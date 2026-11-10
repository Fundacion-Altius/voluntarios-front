import { request as playwrightRequest, type APIRequestContext, type APIResponse } from '@playwright/test';
import { BACKEND_URL } from './helpers';

/**
 * Test-only data for the toys e2e specs. Everything a spec creates is found by
 * diffing against a snapshot taken before it ran, and removed afterwards, so
 * the Altius demo seed (and any other data) is left as it was.
 */

const TOYS = `${BACKEND_URL}/api/toys`;

export interface ToysApi {
  get: (path: string) => Promise<APIResponse>;
  post: (path: string, data?: unknown) => Promise<APIResponse>;
  patch: (path: string, data: unknown) => Promise<APIResponse>;
  del: (path: string) => Promise<APIResponse>;
  /** Sends one file as multipart `field`. */
  upload: (path: string, field: string, file: { name: string; mimeType: string; buffer: Buffer }) => Promise<APIResponse>;
  dispose: () => Promise<void>;
}

/** An API client logged in as `email`, or anonymous when `email` is omitted. */
export async function toysApi(email?: string, password?: string): Promise<ToysApi> {
  const ctx: APIRequestContext = await playwrightRequest.newContext();
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (email) {
    const res = await ctx.post(`${BACKEND_URL}/api/auth/login`, { data: { email, password } });
    if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`);
    const { authToken, csrfToken } = await res.json();
    headers = { ...headers, Authorization: `Bearer ${authToken}`, 'X-CSRF-Token': csrfToken ?? '' };
  }
  return {
    get: (path) => ctx.get(`${TOYS}${path}`, { headers }),
    post: (path, data) => ctx.post(`${TOYS}${path}`, { headers, data: data ?? {} }),
    patch: (path, data) => ctx.patch(`${TOYS}${path}`, { headers, data }),
    del: (path) => ctx.delete(`${TOYS}${path}`, { headers }),
    upload: (path, field, file) => {
      const auth = Object.fromEntries(Object.entries(headers).filter(([k]) => k !== 'Content-Type'));
      return ctx.post(`${TOYS}${path}`, { headers: auth, multipart: { [field]: file } });
    },
    dispose: () => ctx.dispose(),
  };
}

export function adminToysApi(): Promise<ToysApi> {
  return toysApi('admin@fundacionaltius.org', 'admin123');
}

/** A valid EAN-13 derived from a unique tag. */
export function makeEan(tag: string): string {
  const base = `299${tag}`.replace(/\D/g, '').slice(-12).padStart(12, '0').slice(0, 12);
  const sum = [...base].reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0);
  return base + String((10 - (sum % 10)) % 10);
}

export interface Snapshot {
  items: Set<string>;
  children: Set<string>;
  slots: Set<string>;
  dispositions: Set<string>;
  households: Set<string>;
}

type Row = Record<string, string>;

async function rows(api: ToysApi, path: string): Promise<Row[]> {
  const res = await api.get(path);
  if (!res.ok()) throw new Error(`GET ${path} failed: ${res.status()}`);
  return (await res.json()) as Row[];
}

async function keys(api: ToysApi, path: string, key = 'id'): Promise<Set<string>> {
  return new Set((await rows(api, path)).map((r) => r[key]));
}

export async function snapshot(api: ToysApi): Promise<Snapshot> {
  return {
    items: await keys(api, '/items'),
    children: await keys(api, '/children'),
    slots: await keys(api, '/slots'),
    dispositions: await keys(api, '/dispositions'),
    households: await keys(api, '/families', 'code'),
  };
}

function isNewAndTagged(known: Set<string>, id: string, text: string | undefined, tag: string): boolean {
  return !known.has(id) && (text ?? '').toLowerCase().includes(tag.toLowerCase());
}

/**
 * Removes what this spec created: rows that are new since `before` AND carry
 * `tag` in their code, title or label (closures go with their tagged toy), so
 * other specs running in parallel keep their data. Families go first (their
 * bookings, carts and QRs go with them), then closures, slots, children, toys.
 */
export async function cleanupSince(api: ToysApi, before: Snapshot, tag: string): Promise<void> {
  const items = (await rows(api, '/items')).filter((r) => isNewAndTagged(before.items, r.id, r.title, tag));
  const toyIds = new Set(items.map((r) => r.id));
  for (const f of await rows(api, '/families')) {
    if (isNewAndTagged(before.households, f.code, f.code, tag)) await api.del(`/households/${encodeURIComponent(f.code)}`);
  }
  for (const d of await rows(api, '/dispositions')) {
    if (!before.dispositions.has(d.id) && toyIds.has(d.toy_id)) await api.del(`/dispositions/${d.id}`);
  }
  for (const sl of await rows(api, '/slots')) {
    if (isNewAndTagged(before.slots, sl.id, sl.label, tag)) await api.del(`/slots/${sl.id}`);
  }
  for (const c of await rows(api, '/children')) {
    if (isNewAndTagged(before.children, c.id, c.label, tag)) await api.del(`/children/${c.id}`);
  }
  for (const i of items) await api.del(`/items/${i.id}`);
}

/** Creates a family, and when `toyId` is given a checked-out order for it; returns the QR token. */
export async function familyWithOrder(api: ToysApi, code: string, toyId?: string): Promise<string> {
  const fam = await api.post('/households', { code, toy_quota: 3 });
  if (fam.status() !== 201) throw new Error(`household ${code}: ${fam.status()} ${await fam.text()}`);
  if (!toyId) return '';
  const cart = await (await api.post('/carts', { household_id: code })).json();
  await api.post(`/carts/${cart.id}/lines`, { toy_id: toyId, qty: 1 });
  const done = await api.post(`/carts/${cart.id}/checkout`);
  if (done.status() !== 201) throw new Error(`checkout ${code}: ${done.status()} ${await done.text()}`);
  return (await done.json()).qr_token as string;
}

export async function familyRow(api: ToysApi, code: string): Promise<Record<string, unknown> | undefined> {
  const rows = (await (await api.get('/families')).json()) as Record<string, unknown>[];
  return rows.find((r) => r.code === code.toLowerCase());
}

export async function itemQuantity(api: ToysApi, id: string): Promise<number> {
  return Number((await (await api.get(`/items/${id}`)).json()).quantity);
}

/** A 1×1 PNG, enough for picture uploads. */
export function tinyPng(name: string): { name: string; mimeType: string; buffer: Buffer } {
  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
  };
}
