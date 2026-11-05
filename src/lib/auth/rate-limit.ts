import "server-only";

// In-memory login limiter. Per-process only; behind several instances use a shared store (e.g. Redis).
//
// - An attempt is reserved synchronously *before* the slow password check, so parallel
//   requests cannot all slip past the limit.
// - Locked keys are never evicted early: only entries whose window has passed are pruned,
//   so flooding the map with junk keys cannot wipe a lock.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_KEYS = 10_000;
const failures = new Map<string, { count: number; first: number }>();

export type Limit = { key: string; max: number };

function prune(now: number) {
  for (const [k, e] of failures) if (now - e.first > WINDOW_MS) failures.delete(k);
}

function live(key: string, now: number) {
  const e = failures.get(key);
  if (!e) return undefined;
  if (now - e.first > WINDOW_MS) {
    failures.delete(key);
    return undefined;
  }
  return e;
}

/**
 * Reserves one attempt on every key. Returns false (and reserves nothing) if any key is already
 * at its limit. Call clearFailures(keys) after a successful login; a failed one keeps the count.
 */
export function reserveAttempt(limits: Limit[]): boolean {
  const now = Date.now();
  if (limits.some((l) => (live(l.key, now)?.count ?? 0) >= l.max)) return false;
  if (failures.size >= MAX_KEYS) prune(now);
  for (const l of limits) {
    const e = live(l.key, now);
    if (e) e.count += 1;
    else if (failures.size < MAX_KEYS) failures.set(l.key, { count: 1, first: now });
    // Map full of live entries: skip creating a new key, but existing (possibly locked) keys keep counting.
  }
  return true;
}

export function clearFailures(limits: Limit[]) {
  for (const l of limits) failures.delete(l.key);
}
