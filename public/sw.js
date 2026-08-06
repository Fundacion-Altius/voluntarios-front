const CACHE_VERSION = 1;
const QUESTIONS_CACHE = `voluntarios-questions-v${CACHE_VERSION}`;
const CACHE_ALLOWLIST = [QUESTIONS_CACHE];
const DB_NAME = 'voluntarios-survey-queue';
const DB_VERSION = 1;
const STORE_NAME = 'submissions';

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !CACHE_ALLOWLIST.includes(key))
          .map((key) => caches.delete(key)),
      ),
    ).then(() => clients.claim()),
  );
});

// ── IndexedDB helpers ────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromDB() {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

function deleteFromDB(id) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function enqueueToDB(entry) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

// ── Queue helpers (used by both sync and message handlers) ───────────────────
async function replayQueue() {
  const items = await getAllFromDB();
  let replayed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
        credentials: 'include',
      });
      if (res.ok) {
        await deleteFromDB(item.id);
        replayed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { queued: items.length, replayed, failed };
}

function getQueueLength() {
  return getAllFromDB().then((items) => items.length);
}

// ── Fetch handler (questions cache-only, no auth) ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET /api/questions; skip anything with Authorization
  if (request.method !== 'GET') return;
  if (request.headers.has('Authorization')) return;

  const url = new URL(request.url);
  if (!url.pathname.endsWith('/api/questions')) return;

  event.respondWith(
    caches.open(QUESTIONS_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || networkFetch;
      }),
    ),
  );
});

// ── Sync handler ─────────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'survey-submit') {
    event.waitUntil(replayQueue());
  }
});

// ── Message handler (enqueue + queue status) ────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'survey-enqueue') {
    const entry = {
      id: `survey_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      payload: payload.submission,
      url: payload.url,
    };
    event.waitUntil(
      enqueueToDB(entry).then(async () => {
        // Try to register background sync; fall back to immediate replay
        if ('sync' in self.registration) {
          try {
            await self.registration.sync.register('survey-submit');
          } catch {
            // Background Sync not available — replay immediately
            await replayQueue();
          }
        } else {
          await replayQueue();
        }
        // Notify all clients of new queue state
        const queueLen = await getQueueLength();
        const clientsList = await clients.matchAll({ type: 'window' });
        for (const client of clientsList) {
          client.postMessage({ type: 'survey-queue-update', queued: queueLen });
        }
      }),
    );
  }

  if (type === 'survey-queue-status') {
    event.waitUntil(
      getQueueLength().then((len) => {
        event.source.postMessage({ type: 'survey-queue-update', queued: len });
      }),
    );
  }
});

// ── Online event fallback (replay when connectivity returns) ────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Listen for online transitions via client messages
      // The online replay is handled in the client (ClientRatingForm),
      // which sends a 'survey-enqueue' message with the stored submission
      // when the browser fires the 'online' event.
    })(),
  );
});

// ── Push (unchanged) ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Fundación Altius';
    const options = {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: data.url || '/' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // ignore malformed payloads
  }
});

// ── Notification click (unchanged) ──────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});
