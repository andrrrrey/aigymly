'use client';

import { useEffect, useState } from 'react';

/**
 * Returns today's Date, refreshed whenever the app is resumed
 * (tab/PWA becomes visible or the window regains focus). A resident PWA never
 * reloads, so a plain `new Date()` captured once would go stale across a day
 * boundary — this keeps "today" correct after the app is reopened.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setToday(new Date());
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}
