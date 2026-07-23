# GoldBridge AI

**Bridging Companies. Predicting Success.**

AI-powered compatibility analysis for mergers and acquisitions. GoldBridge helps
investment professionals evaluate whether two companies are compatible for a merger
or acquisition *before* a deal is made.

> Inspired by Bernard Goldstein's philosophy of connecting organizations to create
> stronger outcomes. [Learn more](https://civichall.org/bernard-goldstein).

## What this app does

GoldBridge **does not** compute the compatibility score itself. Its job is to:

1. **Collect** company inputs (documents + structured metadata) for Company A and B
2. **Validate** uploaded documents (type, size, completeness)
3. **Organize** everything into a clean, analysis-ready package
4. **Send** it securely to the existing `ma-compatibility-scoring` Claude agent
5. **Display** the returned results in a polished executive dashboard

The scoring model lives entirely in the agent — swapping the mock for the live agent
requires no UI changes because both return the same `CompatibilityResult` shape.

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS** (deep navy / charcoal / metallic-gold design system)
- **Framer Motion** (animations, reveals, transitions)
- Custom SVG charts (gauge, radar, meters) — no chart dependencies
- Light **and** dark mode, responsive, autosaving draft state

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

- `/` — landing page (hero, four dimensions, inspiration, how it works)
- `/analyze` — 3-step wizard: Company A → Company B → Review & Submit
- `/results` — executive dashboard (shows a sample report until you run one)

## Connecting the real scoring agent

Copy `.env.example` to `.env.local` and set:

```bash
MA_SCORING_AGENT_URL=https://…      # agent endpoint
MA_SCORING_AGENT_KEY=…              # bearer token (server-side only)
MA_SCORING_AGENT_NAME=ma-compatibility-scoring
```

`src/app/api/score/route.ts` forwards the organized submission to that endpoint.
When `MA_SCORING_AGENT_URL` is unset, it returns a realistic **mock** so the app is
fully runnable in demo mode. Credentials are read only on the server and never reach
the browser.

## Results include

Overall compatibility score · executive summary · strategic / financial / operational /
cultural fit scorecards · risk level · recommendation · interactive radar & meters ·
downloadable PDF (via print) — plus dedicated risk sections:

- Historical revenue correlation (with the caveat that compatibility extends beyond revenue)
- Market-level concentration (antitrust **flag only**, not a legal determination)
- Customer concentration (HHI + major-customer overlap)
- Data recency & confidence (per-metric freshness and confidence)
- Accounting comparability (GAAP vs. IFRS, adjusted vs. standard EBITDA)
- Key-person & ownership risks (founder dependence, approvals, equity acceleration, retention)
- Precedent M&A transactions (EV/Revenue and EV/EBITDA where available)

## Notes

- The Bernard Goldstein portrait and biography are **placeholders** — replace with
  verified, licensed content from the linked source.
- File uploads are validated and organized client-side for this reference build;
  wire the binary transfer to your secure storage / the agent as needed.
