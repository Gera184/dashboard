# Finance dashboard

Hebrew RTL finance dashboard (Next.js 16, Recharts). Design rules for every site live in `~/Claude/Websites/CLAUDE.md`; Land In Thailand is the reference for structure and quality.

## Design language (recorded per Websites/CLAUDE.md)

- Reference language: Stripe-inspired financial UI (awesome-design-md `stripe`): navy ink, hairline borders, tabular figures for money, pill buttons, soft low shadows. Own palette, not Stripe's indigo.
- Palette ("private ledger"): ink `#0e1b2c`, canvas `#f2f4f6` (cool, never cream), panel `#0c1724`, ledger green `#0f6b55` for actions/focus, mint `#7fd8b8` on dark, income `#138a62`, expense `#c8443b`, brass `#b0812f` only for targets reached. Tokens at the top of `src/app/globals.css`; chart colours in `src/lib/tones.ts`.
- Type: Frank Ruhl Libre (display: page titles, money figures), IBM Plex Sans Hebrew (UI and body). No Heebo/Inter.
- One bold element: the dark "statement" hero on the dashboard (net as a large serif figure, gross/expenses beside it, 12-month net sparkline). Everything else stays quiet: white cards with hairlines, 16px radius (hero 24px, inputs 12px).
- Motion: one load moment (hero count-up, sparkline draw, bars grow), plus press/hover feedback. `prefers-reduced-motion` turns it all off.
- Data stays in `data/finance.json` (gitignored). Never commit it.
