# דשבורד פיננסי (Hebrew RTL financial dashboard)

Next.js 16 (App Router) + React 19 + Recharts. Hebrew, right-to-left, amounts in ₪.
The dashboard starts **empty**. You enter your own data in the app (behind the admin login):

- **הכנסות** (`/dashboard/income`): date, income source, amount in ₪, optional note.
- **הוצאות** (`/dashboard/expenses`): date, category, amount in ₪, optional note.
- **עובדים ועמלות** (`/dashboard/employees`): employees (agents) with a monthly sales target and commission %, plus sales per employee. Commission = sales × rate. **Agent sales count as income** on the dashboard (source "מכירות: <name>").
- The income page is for any other income besides agent sales.

Every card and chart on the main dashboard is computed from those entries for the month chosen in the header (`?month=YYYY-MM`).
Category lists are suggestions; you can type any name.

## Where your data is stored

A single JSON file on the server: `data/finance.json` inside the project folder by default, or the path in the `DATA_FILE` env var.
`/data/` is in `.gitignore`, so it is **never committed**. The file is written atomically with owner-only permissions (0600).
Back it up by copying that file. To start over, stop the server and delete it.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run hash-password          # prompts for the admin password, prints ADMIN_PASSWORD_HASH=...
openssl rand -base64 48        # paste as SESSION_SECRET
# edit .env.local, then:
npm run dev                    # http://localhost:3000
```

Production: `npm run build && npm start` (serve behind HTTPS).

## The single administrator account

There is exactly one user, defined only by server-side environment variables:

| Variable | Purpose |
|---|---|
| `ADMIN_USERNAME` | login name |
| `ADMIN_PASSWORD_HASH` | scrypt hash (`scrypt:N:r:p:salt:hash`) from `npm run hash-password`; the plain password is never stored |
| `ADMIN_DISPLAY_NAME` | name shown in the header (optional) |
| `SESSION_SECRET` | ≥ 32 random characters used to sign session cookies |

If any required variable is missing the app fails closed: nobody can log in.
There is no registration page, no second user and no demo bypass.
To change the password, generate a new hash and restart. To sign everyone out, rotate `SESSION_SECRET`.

## How access is enforced (server-side)

- `src/proxy.ts` runs on the server before every route except `/login` and static assets, and redirects requests without a valid session to `/login`.
- Every protected layout/page/server action also calls `requireSession()` (`src/lib/auth/session.ts`), so protection does not depend on the proxy alone.
- Login is a Server Action: password checked with scrypt + constant-time comparison; username compared in constant time.
- Session = HS256-signed JWT (8h expiry) in an `httpOnly`, `SameSite=Lax` cookie, `Secure` in production. The token is checked against the configured admin username on each request.
- Failed logins are rate-limited (5 per 15 min per IP and per username).
- Security headers: `X-Frame-Options: DENY`, `nosniff`, HSTS, strict referrer policy; `noindex`.

## Known limitations

- The rate limiter is in-memory: it resets on restart and is not shared across multiple instances. Use Redis or your platform's WAF for multi-instance deployments.
- Sessions are stateless; an individual session cannot be revoked before it expires except by rotating `SESSION_SECRET`.
- No MFA. Add TOTP if the dashboard will ever hold real data.
- `x-forwarded-for` is trusted for rate limiting; deploy behind a proxy that sets it (Vercel, Nginx, etc.).
- Commissions are not added to expenses automatically. If you pay them, add an expense in the "עמלות עובדים" category.
- The JSON store is meant for a single server instance; use a real database before running several instances.
- The other sidebar pages (reports, clients, projects, documents, settings) are protected placeholders.
