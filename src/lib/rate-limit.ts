import 'server-only'

// Lightweight in-process rate limiter for the AI endpoints. Guards against
// automated / rapid-fire requests and concurrent duplicate calls from the same
// user. State lives in module memory: this is sufficient for the current
// single-instance (sqlite) deployment; a multi-instance setup would need a
// shared store (Redis) instead. The map is bounded by pruning stale entries.

interface Entry {
  // Timestamp (ms) of the last accepted request.
  last: number
  // Whether a request for this key is currently in flight.
  inFlight: boolean
}

const state = new Map<string, Entry>()

// Minimum spacing between two accepted requests for the same key, in ms.
const MIN_INTERVAL_MS = 5_000

// Drop entries untouched for this long to keep the map from growing unbounded.
const STALE_AFTER_MS = 60 * 60 * 1000

export type RateLimitResult =
  | { ok: true; release: () => void }
  | { ok: false; reason: 'too_many_requests' | 'in_progress' }

function prune(now: number) {
  if (state.size < 1000) return
  for (const [key, entry] of state) {
    if (!entry.inFlight && now - entry.last > STALE_AFTER_MS) state.delete(key)
  }
}

// Attempts to acquire a slot for `key` (e.g. `${userId}:program`). On success
// returns a `release()` that MUST be called (in a finally) once the work is
// done, so concurrent requests are unblocked.
export function acquireRateLimit(key: string): RateLimitResult {
  const now = Date.now()
  prune(now)
  const entry = state.get(key)

  if (entry?.inFlight) {
    return { ok: false, reason: 'in_progress' }
  }
  if (entry && now - entry.last < MIN_INTERVAL_MS) {
    return { ok: false, reason: 'too_many_requests' }
  }

  const next: Entry = { last: now, inFlight: true }
  state.set(key, next)

  return {
    ok: true,
    release: () => {
      next.inFlight = false
      next.last = Date.now()
    },
  }
}
