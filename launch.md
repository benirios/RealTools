# launch.md — RealTools Launch Plan

_Author: Opus 4.8 session · 2026-06-15_

Gated path from current state to a launchable product: a broker can sign up,
source/score listings, **send an OM, and see who opened it**. Distribution is the
hardest piece and the differentiator — full build spec lives in `opusplan.md`.

Critical path ≈ **4–5 days**, dominated by Gate 3. Gates 0–2 collapse to near-zero
wall-clock if run in parallel by a second session (see "Parallelization").

---

## Current state (one line)

Scoring / sourcing / location-intel = far along (v1.6 complete, 56 tests green).
The **send → track OM loop does not work end-to-end** — tracking is built, sending
does not exist. Cannot launch as a deal-distribution tool yet; can demo as a
sourcing/scoring tool.

---

## Gate 0 — Clean foundation (~0.5d) · blocks everything
- [ ] Commit or revert the 3 uncommitted files: `lib/location-intelligence/api.js`,
      `lib/location-intelligence/insights.js`, `tsconfig.json`
- [ ] `next build` green on a clean checkout
- [ ] `npm test` green (`node --test tests/*.test.mjs`)
- [ ] Apply all 19 migrations to prod DB (016 was deferred — `016_strategy_fit_and_match_explanations.sql`)
- [ ] Fix stale `.env.example`: add Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
      `CLERK_SECRET_KEY`) and `RESEND_API_KEY`
- [ ] **Start Resend sending-domain verification NOW** — SPF/DKIM DNS records have
      propagation lead time (hours). Used at Gate 3, but must begin here or it
      bottlenecks launch. No verified domain = zero email delivery.

## Gate 1 — Security gate (~0.5–1d) · blocks exposing real broker/buyer data
RLS is OFF on all tables (migration 019, Clerk era). App-layer `userId` filtering
is the ONLY tenant boundary.
- [ ] Audit every service-role read in `app/(app)/deals/[id]` and `app/api/**/route.ts`
      for a `userId` filter. One missing `.eq('user_id', userId)` = cross-tenant leak.
- [ ] Review `/om/[id]` payload — confirm no sensitive internal fields leak (page is
      public by design; OM UUID is the only gate).
- [ ] Skim `sec-report.md` / `sec-deep-report.md` for still-open HIGH/CRITICAL.

## Gate 2 — Real data, not mock (~0.5d) · blocks a hollow demo
- [ ] Confirm location-intel provider key is set → real nearby businesses render
      (mock/demo sources are hidden, so no key = empty cards).
- [ ] Confirm OLX ingestion returns listings in prod (anti-bot risk) or launch with
      a seeded set.

## Gate 3 — Distribution (~2–3d) · the hard part — full spec in `opusplan.md`
Decision locked: build on the **investor model** (not legacy `buyers`).
- [ ] 3a. Migration `020_investor_om_sends.sql` + `recordInvestorOmOpenByToken` →
      **prove token→open loop** (smallest verifiable slice). Manually insert a send
      row, hit `/om/[id]?ref=<token>`, confirm `om_opened_at` flips exactly once.
- [ ] 3b. `sendOmAction` (`lib/actions/om-actions.ts`) + Resend wire + email template
      (`lib/email/om-template.tsx`) with `/om/[id]?ref=<token>` link + pixel.
- [ ] 3c. Send UI — replace the `ExportsTab` stub in
      `app/(app)/investors/[id]/page.tsx`; recipient picker fed by ranked
      `investor_listing_matches`; disable rows where `investor.email` is null.
- [ ] 3d. "Quem abriu" recipients view (`OmRecipientsCard`) reading `investor_om_sends`.
- Pre-flight gotchas (see opusplan.md):
  - `/om/[id]` currently reads `deals`, NOT `listings` — resolve whether investor
    OMs need a listing-backed public page.
  - `activities.deal_id` is NOT NULL + FKs to `deals` → investor sends can't log to
    `activities`; the send-table carries its own `om_sent_at`/`om_opened_at` state.

## Gate 4 — Live UAT (~0.5d) · closes the v1.0-deferred item
- [ ] End-to-end with a real inbox: sign up → listing → score → send OM → open the
      email link → confirm the open is recorded and visible in the recipients view.

---

## Parallelization (two live sessions)
Clean split, no file overlap:
- **Session A** → Gate 3 distribution. New files: migration 020,
  `lib/actions/om-actions.ts`, `lib/email/*`, send/recipients components. Can start
  3a immediately.
- **Session B** → Gates 0–2. Config, migrations, security audit of existing actions.

A and B do not touch the same files. Gate 4 runs after both converge.

---

## Out of scope (solid — leave alone)
Scoring engine, location-intel, investor matching, deal/notes/files CRUD, Clerk
auth, app shell.

## Hidden critical-path risk
Resend domain DNS verification (Gate 0 start, Gate 3 use). Begin first even though
the code that needs it ships last.
