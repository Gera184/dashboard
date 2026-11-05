import "server-only";
import { KEYS, kv } from "@/lib/kv";

// Login limiter. In Redis when a cloud database is connected (shared by every serverless instance),
// otherwise in memory for the local single-process server.
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
export async function reserveAttempt(limits: Limit[]): Promise<boolean> {
  const redis = kv();
  if (redis) {
    const ok = await redis.eval(
      RESERVE_SCRIPT,
      limits.map((l) => KEYS.limit(l.key)),
      [String(WINDOW_MS), ...limits.map((l) => String(l.max))],
    );
    return Number(ok) === 1;
  }
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

export async function clearFailures(limits: Limit[]) {
  const redis = kv();
  if (redis) {
    await redis.del(...limits.map((l) => KEYS.limit(l.key)));
    return;
  }
  for (const l of limits) failures.delete(l.key);
}

// Atomic: refuse if any key is at its max, otherwise count one attempt on every key.
// The window starts at the first failure (PX set only when the key is new), like the in-memory version.
const RESERVE_SCRIPT = `
for i, k in ipairs(KEYS) do
  if tonumber(redis.call('GET', k) or '0') >= tonumber(ARGV[i + 1]) then return 0 end
end
for i, k in ipairs(KEYS) do
  if redis.call('INCR', k) == 1 then redis.call('PEXPIRE', k, ARGV[1]) end
end
return 1
`;
