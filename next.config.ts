import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Hosts allowed to submit forms through a proxy in front of this app, e.g. the Vercel address that
// passes requests through to this Mac: ALLOWED_ORIGINS=finance-dashboard.vercel.app
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((h) => h.trim()).filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(allowedOrigins.length ? { experimental: { serverActions: { allowedOrigins } } } : {}),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
