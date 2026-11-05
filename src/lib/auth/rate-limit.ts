import "server-only";

// Simple in-memory limiter: 5 failed attempts per key per 15 minutes.
// Per-process only; behind several instances use a shared store (e.g. Redis).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; first: number }>();

export function isLocked(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string) {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: now });
  else entry.count += 1;
  if (failures.size > 10_000) failures.clear();
}

export function clearFailures(key: string) {
  failures.delete(key);
}
