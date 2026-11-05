# דשבורד פיננסי (Hebrew RTL financial dashboard)

Next.js 16 (App Router) + React 19 + Recharts. Hebrew, right-to-left, amounts in ₪.
The dashboard starts **empty**. You enter your own data in the app (behind the admin login):

| Page | What you enter | How it counts |
|---|---|---|
| **נציגים ועמלות** `/dashboard/employees` | agents (monthly target, commission %) and each sale | sales = income (source "מכירות: <name>"); commission = sales × rate |
| **הכנסות** `/dashboard/income` | any other income | income |
| **הוצאות** `/dashboard/expenses` | date, category, amount | expense |
| **משכורות** `/dashboard/salaries` | employee, date, salary cost | expense (category "משכורות") |
| **הלוואות** `/dashboard/loans` | lender, amount, monthly repayment, number of payments, first payment | each month's repayment = expense, automatically |
| **לקוחות והזמנות** `/dashboard/clients` | client orders, marked paid / unpaid | "clients who paid this month: X of Y" and open amount (not added to income, to avoid double counting with agent sales) |

The main dashboard shows, for the month chosen in the header (`?month=YYYY-MM`): gross (total income), expenses and net,
clients who paid, salaries and loan repayments, a 12-month income/expense chart, how much each agent brought in and their commission,
income by source, expenses by category and a daily/weekly chart.

## Where your data is stored

A single JSON file on the server: `data/finance.json` inside the project folder by default, or the path in the `DATA_FILE` env var.
`/data/` is in `.gitignore`, so it is **never committed**. The file is written atomically with owner-only permissions (0600).
Automatic backups go to `data/backups/` (beside the data file): the first change of each day saves a copy of the
file as it was (`finance-YYYY-MM-DD.json`, last 30 days kept), and every delete first saves
`finance-before-last-delete.json`. To restore, stop the server and copy a backup over `finance.json`.
To start over, stop the server and delete the file.

Sales agents who leave can be **archived** on the agents page: they disappear from the sales form, and their sales stay
in every past month. An agent can only be deleted while they have no sales.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run hash-password          # prompts for the admin password, prints ADMIN_PASSWORD_HASH=...
openssl rand -base64 48        # paste as SESSION_SECRET
# edit .env.local, then:
npm run dev                    # http://localhost:3000 (this computer only)
```

`npm run dev` and `npm start` listen on `127.0.0.1` only, so other devices on the Wi-Fi cannot reach the app.
For access from elsewhere, put it behind HTTPS (for example Tailscale) rather than opening the port. If a reverse
proxy is in front, set `TRUST_PROXY=1` so the login limit uses the real client address.

## Deploy to Vercel

Vercel's disk is temporary, so a hosted copy keeps its data in a Redis database (Upstash, free tier) instead of `data/finance.json`.

1. Import the GitHub repo at https://vercel.com/new (framework: Next.js, no build settings to change).
2. In the Vercel project, open **Storage → Create / Connect Database → Upstash for Redis**, connect it to the project.
   This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. In **Settings → Environment Variables**, add `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`
   (and optionally `ADMIN_DISPLAY_NAME`). Never commit these.
4. Redeploy. Without a database the hosted app refuses to start saving rather than losing entries.

In Redis the app keeps: the ledger (`finance:store`), a copy of the first state of each day for 31 days
(`finance:backup:YYYY-MM-DD`), the copy before the last delete (`finance:backup:before-last-delete`),
login lockout counters and the logout cut-off. Saves use a revision check, so two quick changes from
different serverless instances cannot overwrite each other. On Vercel the login limiter trusts
`X-Forwarded-For` automatically (Vercel sets it). Locally, with no Redis variables, everything stays in files as before.

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
To change the password, generate a new hash and restart. Logging out ends every session (also copies of the cookie);
rotating `SESSION_SECRET` does the same.

## How access is enforced (server-side)

- `src/proxy.ts` runs on the server before every route except `/login` and static assets, and redirects requests without a valid session to `/login`.
- Every protected layout/page/server action also calls `requireSession()` (`src/lib/auth/session.ts`), so protection does not depend on the proxy alone.
- Login is a Server Action: password checked with scrypt + constant-time comparison; username compared in constant time.
- Session = HS256-signed JWT (8h expiry) in an `httpOnly`, `SameSite=Lax` cookie, `Secure` in production. The token is checked against the configured admin username on each request.
- Failed logins are rate-limited: 5 per 15 min per client address (taken from `X-Forwarded-For` only when `TRUST_PROXY=1`),
  and 20 per 15 min for the admin username from all addresses. Attempts are counted before the password check, and
  locks cannot be flushed out by flooding.
- Logout writes a cut-off time to `data/session.json`; tokens issued before it are rejected.
- Security headers: `X-Frame-Options: DENY`, `nosniff`, HSTS, strict referrer policy; `noindex`.

## Known limitations

- Locally (no Redis) the rate limiter is in memory and resets on restart. Hosted with Redis it is shared and persistent.
- Sessions are stateless; an individual session cannot be revoked before it expires except by rotating `SESSION_SECRET`.
- No MFA. Add TOTP if the dashboard will ever hold real data.
- `x-forwarded-for` is trusted for rate limiting; deploy behind a proxy that sets it (Vercel, Nginx, etc.).
- Commissions are not added to expenses automatically. If you pay them, add an expense in the "עמלות עובדים" category.
- Loan repayments are a fixed monthly amount; interest changes are not modelled.
- The JSON store is meant for a single server instance; use a real database before running several instances.
