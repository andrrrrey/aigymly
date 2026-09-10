'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
      return;
    }

    // If a controller already exists, the page is being run by an installed
    // worker. When a newly deployed worker takes over (controllerchange), do a
    // single reload so a resident PWA picks up the fresh bundle instead of
    // continuing to run stale JS. Skipped on the very first install (no
    // previous controller), so a first-time visitor isn't reloaded.
    let reloading = false;
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    }

    // updateViaCache: 'none' forces the browser to revalidate sw.js itself on
    // every check, so a new build's worker is detected promptly.
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Check for a new worker whenever the app regains focus — a resident
        // PWA may not navigate for days, so this is when updates get noticed.
        const checkForUpdate = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', checkForUpdate);
        window.addEventListener('focus', checkForUpdate);
      })
      .catch(() => {});
  }, []);

  return null;
}
