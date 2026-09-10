// Self-destructing service worker.
//
// Earlier builds shipped a caching PWA worker. After the app migrated its
// client/server communication from Server Actions to /api route handlers,
// installed PWAs kept running the old cached bundle and POSTed Server Action
// ids that no longer exist in the current build, producing
// "Failed to find Server Action ... reading 'workers'".
//
// This worker exists only to flush those stuck clients: it deletes every
// cache, unregisters itself and reloads any open window onto the network so
// the fresh bundle loads. The current app no longer registers a service
// worker, so once a client is flushed it stays flushed.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      await Promise.all(
        clients.map((c) =>
          typeof c.navigate === 'function' ? c.navigate(c.url).catch(() => {}) : null
        )
      );
    })()
  );
});
