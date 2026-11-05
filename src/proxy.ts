import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// First line of defence: every route except /login and static assets needs a valid session.
// Pages re-check the session server-side (requireSession) so protection never relies on this file alone.
const COOKIE = "fd_session";

async function isValid(token: string | undefined) {
  const secret = process.env.SESSION_SECRET;
  const username = process.env.ADMIN_USERNAME?.trim();
  if (!token || !secret || secret.length < 32 || !username) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
      audience: "finance-dashboard",
    });
    return payload.sub === username && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // /login is always reachable. The page itself sends signed-in users on (it can also see logouts,
  // which this file cannot), so a revoked cookie never causes a redirect loop.
  if (pathname === "/login") return NextResponse.next();
  if (!(await isValid(request.cookies.get(COOKIE)?.value))) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
