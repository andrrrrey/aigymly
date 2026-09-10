'use client';

// A localStorage-compatible storage that never throws.
//
// Some environments block Web Storage entirely: iOS Safari with "Block All
// Cookies", strict private modes, and in-app browsers (Telegram, VK,
// Instagram, etc.). In several of them even *reading* the `localStorage`
// global throws a SecurityError. Because the zustand store is created at module
// import time, such a throw crashes the whole bundle before React can render —
// a blank white screen, with no error boundary able to recover it.
//
// getSafeStorage() returns real localStorage when it is actually usable and
// falls back to an in-memory store (state kept for the current session only)
// when it is not, so the app always renders.

type SimpleStorage = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
};

function createMemoryStorage(): SimpleStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name) => (map.has(name) ? (map.get(name) as string) : null),
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

let cached: SimpleStorage | null = null;

export function getSafeStorage(): SimpleStorage {
  if (cached) return cached;

  try {
    const testKey = '__aigymly_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    cached = localStorage;
  } catch {
    // localStorage is unavailable or blocked — keep state in memory instead of
    // crashing.
    cached = createMemoryStorage();
  }

  return cached;
}
