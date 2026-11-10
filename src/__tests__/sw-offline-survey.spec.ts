import fs from 'fs';
import path from 'path';
import { IDBFactory } from 'fake-indexeddb';

type Handler = (event: Record<string, unknown>) => void;

function mockFetch(impl: () => Promise<unknown>) {
  global.fetch = jest.fn(impl) as unknown as typeof fetch;
}

function mockFetchReject() {
  mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
}

function makeRequest(url: string, init?: { method?: string; headers?: Record<string, string>; mode?: string }) {
  const headersMap = init?.headers || {};
  return {
    url,
    method: init?.method || 'GET',
    mode: init?.mode || 'cors',
    headers: {
      has: (name: string) => Object.prototype.hasOwnProperty.call(headersMap, name),
    },
  };
}

function makeResponse(body: string | object, ok = true) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok,
    status: ok ? 200 : 500,
    clone: () => makeResponse(body, ok),
    text: async () => text,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
  };
}

function makeEvent(overrides: Record<string, unknown>): Record<string, unknown> {
  const waitUntil = jest.fn((p: Promise<unknown>) => p);
  return {
    waitUntil,
    respondWith: jest.fn((p: Promise<unknown>) => p),
    ...overrides,
  };
}

async function flushWaitUntil(event: Record<string, unknown>) {
  const mock = event.waitUntil as unknown as jest.Mock;
  for (const result of mock.mock.results) {
    await result.value;
  }
}

function createCacheMock() {
  const store = new Map<string, { url: string; response: ReturnType<typeof makeResponse> }[]>();

  const cache = {
    add: jest.fn(async (url: string) => {
      const entry = { url, response: makeResponse('shell') };
      store.set('default', [...(store.get('default') || []), entry]);
    }),
    addAll: jest.fn(async (urls: string[]) => {
      await Promise.all(urls.map((u) => cache.add(u)));
    }),
    match: jest.fn(async (request: { url: string }) => {
      const url = request.url;
      const entry = (store.get('default') || []).find((e) => e.url === url);
      return entry ? entry.response.clone() : undefined;
    }),
    put: jest.fn(async (request: { url: string }, response: ReturnType<typeof makeResponse>) => {
      const entry = { url: request.url, response: response.clone() };
      store.set('default', [...(store.get('default') || []), entry]);
    }),
    keys: jest.fn(async () => []),
  };

  return {
    cache: cache as unknown as Cache,
    caches: {
      open: jest.fn(async () => cache),
      keys: jest.fn(async () => ['voluntarios-questions-v1', 'voluntarios-survey-shell-v1']),
      delete: jest.fn(async () => true),
      match: jest.fn(async () => undefined),
    } as unknown as CacheStorage,
    store,
  };
}

function loadSW(overrides: Record<string, unknown> = {}) {
  const handlers: Record<string, Handler[]> = {};

  const selfObj: Record<string, unknown> = {
    addEventListener: (type: string, cb: Handler) => {
      handlers[type] = handlers[type] || [];
      handlers[type].push(cb);
    },
    skipWaiting: jest.fn(),
    clients: {
      matchAll: jest.fn(async () => []),
      openWindow: jest.fn(async () => {}),
      claim: jest.fn(async () => {}),
    },
    location: { origin: 'http://localhost:3000' },
    registration: {
      sync: { register: jest.fn(async () => {}) },
      showNotification: jest.fn(async () => {}),
    },
    ...overrides,
  };

  const src = fs.readFileSync(path.join(__dirname, '../../public/sw.js'), 'utf-8');
  const fn = new Function('self', src);
  fn(selfObj);

  return { selfObj, handlers };
}

async function dispatch(handlers: Handler[], event: Record<string, unknown>) {
  for (const handler of handlers) {
    await handler(event);
  }
}

function enqueuePayload(submission: Record<string, unknown>, url: string) {
  return { type: 'survey-enqueue', payload: { submission, url } };
}

describe('sw.js offline survey', () => {
  beforeEach(async () => {
    (globalThis as Record<string, unknown>).indexedDB = new IDBFactory() as unknown as IDBFactory;
    (globalThis as Record<string, unknown>).clients = {
      matchAll: jest.fn(async () => []),
      openWindow: jest.fn(async () => {}),
      claim: jest.fn(async () => {}),
    };
    (globalThis as Record<string, unknown>).caches = createCacheMock().caches as unknown as CacheStorage;
  });

  it('skips requests carrying an Authorization header', async () => {
    const { handlers } = loadSW();
    const req = makeRequest('http://localhost:3001/api/questions', {
      headers: { Authorization: 'Bearer token' },
    });
    const event = makeEvent({ request: req });
    await dispatch(handlers['fetch'] || [], event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('only intercepts GET requests', async () => {
    const { handlers } = loadSW();
    const req = makeRequest('http://localhost:3001/api/questions', { method: 'POST' });
    const event = makeEvent({ request: req });
    await dispatch(handlers['fetch'] || [], event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('caches questions response for GET /api/questions', async () => {
    const { cache, caches } = createCacheMock();
    globalThis.caches = caches as unknown as CacheStorage;
    const { handlers } = loadSW();
    const req = makeRequest('http://localhost:3001/api/questions');
    const event = makeEvent({ request: req });
    mockFetch(async () => makeResponse([{ id: 1 }]));

    await dispatch(handlers['fetch'] || [], event);
    await (event.respondWith as jest.Mock).mock.results[0].value;

    expect(cache.put).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 200 }),
    );
    expect(fetch).toHaveBeenCalledWith(req);
  });

  it('serves cached questions when offline (network fails)', async () => {
    const { cache, caches } = createCacheMock();
    cache.match = jest.fn(async () => makeResponse([{ id: 9 }])) as unknown as Cache['match'];
    globalThis.caches = caches as unknown as CacheStorage;
    const { handlers } = loadSW();
    const req = makeRequest('http://localhost:3001/api/questions');
    const event = makeEvent({ request: req });
    mockFetchReject();

    await dispatch(handlers['fetch'] || [], event);
    const resp = await (event.respondWith as jest.Mock).mock.results[0].value;

    expect(await resp.json()).toEqual([{ id: 9 }]);
  });

  it('enqueues a submission on survey-enqueue', async () => {
    const { handlers } = loadSW();
    const event = makeEvent({
      data: enqueuePayload({ surveyID: 1, ratings: { 1: 5 } }, 'http://localhost:3001/api/surveys/submit-answer'),
    });
    await dispatch(handlers['message'] || [], event);

    const items = await new Promise<unknown[]>((resolve, reject) => {
      const req = indexedDB.open('voluntarios-survey-queue', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('submissions', 'readonly');
        const store = tx.objectStore('submissions');
        const get = store.getAll();
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      };
      req.onerror = () => reject(req.error);
    });
    expect(items).toHaveLength(1);
    expect((items[0] as { payload: { surveyID: number } }).payload.surveyID).toBe(1);
  });

  it('replays queued submissions on sync and deletes on success', async () => {
    const { handlers } = loadSW();
    mockFetch(async () => makeResponse('ok'));

    const enqueueEvent = makeEvent({
      data: enqueuePayload({ surveyID: 2, ratings: { 1: 4 } }, 'http://localhost:3001/api/surveys/submit-answer'),
    });
    await dispatch(handlers['message'] || [], enqueueEvent);
    await flushWaitUntil(enqueueEvent);

    const syncEvent = makeEvent({ tag: 'survey-submit' });
    await dispatch(handlers['sync'] || [], syncEvent);
    await flushWaitUntil(syncEvent);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/surveys/submit-answer',
      expect.objectContaining({ method: 'POST' }),
    );

    const items = await new Promise<unknown[]>((resolve, reject) => {
      const req = indexedDB.open('voluntarios-survey-queue', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('submissions', 'readonly');
        const store = tx.objectStore('submissions');
        const get = store.getAll();
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      };
      req.onerror = () => reject(req.error);
    });
    expect(items).toHaveLength(0);
  });

  it('retains a queued submission when replay fails', async () => {
    const { handlers } = loadSW();
    mockFetch(async () => makeResponse('error', false));

    const enqueueEvent = makeEvent({
      data: enqueuePayload({ surveyID: 3, ratings: { 1: 3 } }, 'http://localhost:3001/api/surveys/submit-answer'),
    });
    await dispatch(handlers['message'] || [], enqueueEvent);

    const syncEvent = makeEvent({ tag: 'survey-submit' });
    await dispatch(handlers['sync'] || [], syncEvent);

    const items = await new Promise<unknown[]>((resolve, reject) => {
      const req = indexedDB.open('voluntarios-survey-queue', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('submissions', 'readonly');
        const store = tx.objectStore('submissions');
        const get = store.getAll();
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      };
      req.onerror = () => reject(req.error);
    });
    expect(items).toHaveLength(1);
  });

  it('serves the survey shell from cache on offline navigation', async () => {
    const { cache, caches } = createCacheMock();
    cache.match = jest.fn(async (request: unknown) => {
      const url = typeof request === 'string' ? request : (request as { url: string }).url;
      if (url.endsWith('/es/encuesta')) return makeResponse('cached shell');
      return undefined;
    }) as unknown as Cache['match'];
    globalThis.caches = caches as unknown as CacheStorage;
    const { handlers } = loadSW();

    const req = makeRequest('http://localhost:3000/es/encuesta', { method: 'GET', mode: 'navigate' });
    const event = makeEvent({ request: req });

    mockFetchReject();
    await dispatch(handlers['fetch'] || [], event);
    const resp = await (event.respondWith as jest.Mock).mock.results[0].value;

    expect(await resp.text()).toBe('cached shell');
  });
});