import "server-only";
import { Redis } from "@upstash/redis";

// Cloud storage for hosted deployments (Vercel). When a Redis database is connected, Vercel's Upstash
// integration sets KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + _TOKEN), and the app
// keeps its data, backups, login lockouts and logout cut-off there. Without them it uses local files.

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let client: Redis | null = null;

/** The Redis client, or null when no cloud database is configured (local file mode). */
export function kv(): Redis | null {
  if (!url || !token) {
    // Vercel's disk is temporary and read-only: never pretend to save there.
    if (process.env.VERCEL) throw new Error("No database connected. Add Upstash Redis in the Vercel project's Storage tab, then redeploy.");
    return null;
  }
  client ??= new Redis({ url, token, automaticDeserialization: false });
  return client;
}

export const KEYS = {
  store: "finance:store",
  rev: "finance:rev",
  backup: (day: string) => `finance:backup:${day}`,
  beforeDelete: "finance:backup:before-last-delete",
  revokedBefore: "auth:revoked-before",
  limit: (key: string) => `auth:limit:${key}`,
};
