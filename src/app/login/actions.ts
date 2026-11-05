"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminConfig } from "@/lib/auth/config";
import { safeEqual, verifyPassword } from "@/lib/auth/password";
import { clearFailures, isLocked, recordFailure } from "@/lib/auth/rate-limit";
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

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  const keys = [`ip:${ip}`, `user:${username.toLowerCase()}`];
  if (keys.some(isLocked)) {
    return { error: "יותר מדי ניסיונות כושלים. נסו שוב בעוד 15 דקות.", username };
  }

  // Always run the scrypt check so timing does not reveal whether the username exists.
  const passwordOk = await verifyPassword(password, config.passwordHash);
  const userOk = safeEqual(username, config.username);
  if (!userOk || !passwordOk) {
    keys.forEach(recordFailure);
    return { error: "שם המשתמש או הסיסמה שגויים.", username };
  }

  keys.forEach(clearFailures);
  await setSessionCookie(await createSessionToken(config.username, config.sessionSecret));
  redirect("/dashboard");
}

export async function logout() {
  await requireSession();
  await clearSessionCookie();
  redirect("/login");
}
