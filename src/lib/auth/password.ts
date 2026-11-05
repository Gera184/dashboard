import "server-only";
import { createHash, scrypt, timingSafeEqual } from "node:crypto";

function scryptAsync(pw: string, salt: Buffer, keylen: number, opts: { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(pw, salt, keylen, { ...opts, maxmem: 64 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Verifies a password against "scrypt:N:r:p:salt:hash" (base64url). Constant-time compare. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every(Number.isInteger)) return false;
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (expected.length < 32) return false;
  const actual = await scryptAsync(password.normalize("NFKC"), salt, expected.length, { N, r, p });
  return timingSafeEqual(actual, expected);
}

/** Constant-time string equality (hashes first so lengths match). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
