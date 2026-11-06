"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminConfig } from "@/lib/auth/config";
import { safeEqual, verifyPassword } from "@/lib/auth/password";
import { clearFailures, reserveAttempt, type Limit } from "@/lib/auth/rate-limit";
import { clearSessionCookie, createSessionToken, requireSession, setSessionCookie } from "@/lib/auth/session";

export type LoginState = { error?: string; username?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().slice(0, 100);
  const password = String(formData.get("password") ?? "").slice(0, 200);

  const config = getAdminConfig();
  if (!config) {
    return { error: "המערכת אינה מוגדרת. יש להגדיר את משתני הסביבה של מנהל המערכת בשרת." };
  }
  if (!username || !password) return { error: "יש למלא שם משתמש וסיסמה.", username };

  // X-Forwarded-For is set by the client unless a trusted proxy overwrites it, so only use it when
  // TRUST_PROXY=1 says such a proxy is in front. Otherwise every request shares one "direct" bucket.
  const h = await headers();
  // Vercel overwrites X-Forwarded-For with the real client address, so it is trusted there automatically.
  const trustProxy = process.env.TRUST_PROXY === "1" || process.env.VERCEL === "1";
  const ip = trustProxy ? (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim() : "direct";
  const limits: Limit[] = [{ key: `ip:${ip}`, max: 5 }];
  // Backstop against guessing the real username from many addresses. Only the configured username
  // gets a key, so junk usernames cannot grow the table.
  const userKey = username.toLowerCase();
  if (safeEqual(userKey, config.username.toLowerCase())) limits.push({ key: `user:${userKey}`, max: 20 });

  // Reserve the attempt before the slow check, so parallel requests cannot bypass the limit.
  if (!reserveAttempt(limits)) {
    return { error: "יותר מדי ניסיונות כושלים. נסו שוב בעוד 15 דקות.", username };
  }

  // Always run the scrypt check so timing does not reveal whether the username exists.
  const passwordOk = await verifyPassword(password, config.passwordHash);
  const userOk = safeEqual(username, config.username);
  if (!userOk || !passwordOk) {
    return { error: "שם המשתמש או הסיסמה שגויים.", username };
  }

  clearFailures(limits);
  await setSessionCookie(await createSessionToken(config.username, config.sessionSecret));
  redirect("/dashboard");
}

export async function logout() {
  await requireSession();
  await clearSessionCookie();
  redirect("/login");
}
