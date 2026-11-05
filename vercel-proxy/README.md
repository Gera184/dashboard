# Vercel address that passes through to the Mac

The dashboard runs on the Mac and saves to `data/finance.json` there. This folder is a tiny Vercel
project with no code: it forwards every request to the Mac over Tailscale Funnel (HTTPS).
The site only works while the Mac is on, awake and running the app.

1. On the Mac: `npm run build && npm start` (listens on 127.0.0.1:3000), with `.env.local` also containing
   `TRUST_PROXY=1` and `ALLOWED_ORIGINS=<your-project>.vercel.app`.
2. Expose it: `tailscale funnel --bg 3000` gives `https://<mac>.<tailnet>.ts.net`.
3. `cp vercel.json.example vercel.json`, put that address in `destination` (vercel.json is gitignored),
   then from this folder: `npx vercel deploy --prod`.

The login, sessions and data all stay on the Mac. Vercel only relays the traffic.
