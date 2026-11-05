import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_FILE } from "@/lib/store";
import { getAdminConfig, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./config";

export type Session = { username: string; displayName: string };

export async function createSessionToken(username: string, secret: Uint8Array) {
  return new SignJWT({ role: "admin", iatMs: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setAudience("finance-dashboard")
    .sign(secret);
}

/** Verifies a token and checks it belongs to the configured admin. */
export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  const config = getAdminConfig();
  if (!config || !token) return null;
  try {
    const { payload } = await jwtVerify(token, config.sessionSecret, {
      algorithms: ["HS256"],
      audience: "finance-dashboard",
    });
    if (payload.sub !== config.username || payload.role !== "admin") return null;
    // Tokens issued before the last logout are dead, even if someone copied the cookie.
    if (typeof payload.iatMs !== "number" || payload.iatMs < (await revokedBefore())) return null;
    return { username: config.username, displayName: config.displayName };
  } catch {
    return null;
  }
}

// Logout writes a timestamp here; every token issued at or before it is rejected.
const REVOCATION_FILE = path.join(path.dirname(DATA_FILE), "session.json");

async function revokedBefore(): Promise<number> {
  try {
    const v = JSON.parse(await readFile(/*turbopackIgnore: true*/ REVOCATION_FILE, "utf8"))?.revokedBefore;
    return typeof v === "number" ? v : 0;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return 0;
    return Number.POSITIVE_INFINITY; // unreadable file: fail closed (sign in again after fixing it)
  }
}

/** Ends every session, including copies of the cookie on other devices. */
export async function revokeAllSessions() {
  await mkdir(/*turbopackIgnore: true*/ path.dirname(REVOCATION_FILE), { recursive: true, mode: 0o700 });
  const tmp = `${REVOCATION_FILE}.${process.pid}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify({ revokedBefore: Date.now() }), { mode: 0o600 });
  await rename(/*turbopackIgnore: true*/ tmp, REVOCATION_FILE);
}

/** Called on successful login: if the revocation file is damaged, replace it so the new session works. */
export async function repairRevocationFile() {
  if ((await revokedBefore()) === Number.POSITIVE_INFINITY) await revokeAllSessions();
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Use in every protected server component / action. Redirects to /login when not signed in. */
export async function requireSession(): Promise<Session> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect("/login");
  return session;
}
