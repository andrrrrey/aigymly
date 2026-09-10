'use client';

import { useEffect } from 'react';

// The app no longer uses a service worker. This component actively tears down
// any worker/cache left over from older builds so that clients which cached a
// stale bundle (and kept hitting dead Server Action endpoints) recover onto
// the current /api-based build.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
  }, []);

  return null;
}
