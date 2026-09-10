// BUILD_ID is stamped on every build by scripts/build-sw.mjs so that each
// deployment ships a byte-different service worker. That guarantees the
// browser detects an update, activates the new worker and purges the caches
// of previous builds — otherwise resident PWAs keep running stale JS chunks
// (and, historically, stale Server Action ids) forever.
const BUILD_ID = 'dev';
const CACHE = `aigymly-${BUILD_ID}`;
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API responses — always hit the network so data (workouts,
  // dates) is never served stale to a resident PWA. Let the request pass
  // through untouched.
  if (url.pathname.startsWith('/api/')) return;

  // Navigation/HTML requests: network-first so the app shell (and its
  // date-dependent logic) is fresh on every resume; fall back to cache only
  // when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: stale-while-revalidate. The cache is scoped to the current
  // BUILD_ID and every previous build's cache is deleted on activate, so a
  // cache hit can only ever be an asset from the running build — no
  // cross-deploy staleness.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
