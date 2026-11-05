import "server-only";

export const SESSION_COOKIE = "fd_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type AdminConfig = {
  username: string;
  passwordHash: string;
  displayName: string;
  sessionSecret: Uint8Array;
};

/** Reads the single admin account from server-side env. Returns null if misconfigured (fail closed). */
export function getAdminConfig(): AdminConfig | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const secret = process.env.SESSION_SECRET;
  if (!username || !passwordHash || !secret || secret.length < 32) return null;
  if (!passwordHash.startsWith("scrypt:")) return null;
  return {
    username,
    passwordHash,
    displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || "מנהל המערכת",
    sessionSecret: new TextEncoder().encode(secret),
  };
}
