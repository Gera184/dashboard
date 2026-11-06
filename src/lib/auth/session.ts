import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminConfig, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./config";

export type Session = { username: string; displayName: string };

export async function createSessionToken(username: string, secret: Uint8Array) {
  return new SignJWT({ role: "admin" })
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
    return { username: config.username, displayName: config.displayName };
  } catch {
    return null;
  }
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
