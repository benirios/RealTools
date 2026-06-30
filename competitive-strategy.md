# RealTools — Competitive Strategy & Improvement Plan

_Author: Opus 4.8 · 2026-06-19_
_Inputs: `market-research.md` (competitive scan) + the 2026-06-17 codebase gate-audit._
_Principle: **don't reinvent the wheel — make it smoother.** Polish what's already built, fix the few fragile joints, cut legacy drag. No new categories._

---

## 1. Executive summary (o resumo)

RealTools sits in a **category gap**: in Brazil, nobody runs the full commercial
deal flow — **source → AI-score → match investor → generate OM → send → track
opens** — in Portuguese, at a corretor's price. The mature end-to-end platforms
(Buildout, CREXi, Reonomy, Revere, Altrio) are **US/Canada, enterprise-priced,
English-only**. The Brazilian players (DWV, Jetimob, Kenlo, QuintoAndar) are
**residential CRMs / portals**, none of which score, match, or generate OMs.

So the product already wins on paper. The job now is **not to build more** — it's
to make the existing wheel turn smoothly:

1. **Double-down on the two things no BR rival has — investor matching + OM
   send/track — and make them visibly better** (esp. *explain* the match).
2. **Fix the three fragile joints** that undercut a working demo: OLX sourcing
   (scrape is brittle + copyable), email delivery (no verified domain = nothing
   sends), and real location data (was a dead config path — now fixed, needs the
   prod key).
3. **Cut the legacy `buyers`/`deals` drag** left over from the pivot to the
   investor model — less surface, less confusion, faster iteration.

Three moves, all on assets that already exist. That's the whole plan.

---

## 2. Where we stand vs the market (condensed)

Capabilities: **Src** local/portal sourcing · **AI** property scoring · **Loc**
location intel · **Match** investor matching · **OM** OM generation · **Track**
send+open tracking · **BR** pt-BR/Brazil-local.

| Player |       Geo | Src | AI |Loc | Match | OM | Track | BR | Segment |
|---------------|----|----|----|-----|----|---|----|-----|-----|
| **RealTools** | 🇧🇷 | ✅ | ✅ | ✅ |   ✅   | ✅ |  ✅  | ✅ | SMB broker |
| Buildout      | 🇺🇸 | ⚠️ | ⚠️ | ❌ |   ❌   | ✅ |  ✅  | ❌ | Mid/Enterprise |
| CREXi         | 🇺🇸 | ✅ | ⚠️ | ⚠️ |   ❌   | ✅ |  ✅  | ❌ | Enterprise |
| Reonomy       | 🇺🇸 | ❌ | ✅ | ⚠️ |   ❌   | ❌ |  ❌  | ❌ | Data |
| Revere        | 🇺🇸 | ❌ | ✅ | ❌ |   ✅   | ❌ |  ❌  | ❌ | Institutional |
| Altrio        | 🇨🇦 | ⚠️ | ✅ | ❌ |   ✅   | ❌ |  ❌  | ❌ | Investment teams |
| DWV           | 🇧🇷 | ✅ | ❌ | ❌ |   ❌   | ❌ |  ❌  | ✅ | Residential dev |
| Jetimob       | 🇧🇷 | ✅ | ❌ | ❌ |   ❌   | ❌ |  ❌  | ✅ | Brokers (resi) |
| Kenlo/Tecimob | 🇧🇷 | ✅ | ❌ | ❌ |   ❌   | ❌ |  ❌  | ✅ | Residential CRM |
| QuintoAndar   | 🇧🇷 | ✅ | ⚠️ | ⚠️ |   ❌   | ❌ |  ❌  | ✅ | Residential |
| Kognita       | 🇧🇷 | ❌ | ⚠️ | ✅ |   ❌   | ❌ |  ❌  | ✅ | Retail geo-intel |

**Competitor weaknesses we exploit:**
- **Buildout** ($125/user/mo) — no investor matching, no opportunity scoring, no
  location intel, no pt-BR/OLX.
- **CREXi / Revere / Dealpath** — enterprise/institutional (~$20M deals) → the
  SMB-broker lane is empty.
- **Reonomy** — US-only data, zero Brazil coverage.
- **Altrio** — sources from the email inbox, not portals; no Brazil, no OM gen.
- **Jetimob** (BR) — has an **official OLX integration** but no AI/match/OM/track.
  (This is the warning: our OLX *scraping* is the weakest, most copyable part.)

_Full per-competitor detail + sources: see `market-research.md`._

---

## 3. Double-down — sharpen what already wins (KEEP + polish)

These are live, audited-solid, and unique in BR. Don't rebuild — make them
*obviously* better than a residential CRM.

| # | Asset (already built) | Smoothing move | Why it beats rivals |
|---|---|---|---|
| D1 | **Investor matching** (`investor_listing_matches`) | Surface **"why this match"** — wire up the match-explanation columns from migration `016_strategy_fit_and_match_explanations` into the recipient picker + OM. | Matching is the one verb no BR rival has. Explainable matching = trust = the moat. Reonomy/Revere only do it for US/institutional. |
| D2 | **OM send + open tracking** (`investor_om_sends`, idempotent recorder) | Add a **"seu OM foi aberto" notification** to the broker when `om_opened_at` flips. The atomic open-claim already exists — just react to it. | Nobody in BR sends+tracks OMs. The "who opened" loop is the demo moment; a re-engagement ping makes it feel alive. |
| D3 | **pt-BR + SMB pricing** | Keep the price wedge explicit; never drift toward per-seat enterprise pricing. | Buildout/CREXi/Revere can't follow down-market without cannibalizing. This lane is structurally ours. |
| D4 | **Location intelligence** (now that the key is wired) | Show nearby-business + demographic context **inside the OM** as a selling point, not just internal scoring. | Reonomy = US data; Kognita = retail-only. CRE-deal + location-intel together in BR = unique. |

---

## 4. Improve — smooth the fragile joints (prioritized)

Ranked by **impact ÷ effort**. Every item is a polish on existing code, not a new
feature.

| Pri | Move | Where (file/area) | Effort | Why / competitor angle |
|---|---|---|---|---|
| 🔴 P0 | **Verify Resend sending domain** (SPF/DKIM) | DNS + Resend acct | S (lead time) | No verified domain = zero delivery. The whole send/track moat is dead until this is live. |
| 🔴 P0 | **Stop silent "sent" with no Resend key** — hard-fail when `createResendClient()` is null | `lib/actions/om-actions.ts` | S | Today it records a send + says "✓ enviado" but emails nothing. A misconfigured prod silently loses every OM. |
| 🔴 P0 | **Set `GOOGLE_MAPS_API_KEY` in prod** (wiring bug already fixed) | prod env | S | Without it, nearby-business cards are empty — kills the location-intel differentiator (D4). |
| 🟠 P1 | **Make OLX sourcing robust** — pursue an **official OLX integration / data feed** (Jetimob has one) or a licensed source; treat scraping as fallback + ship a seeded set | `lib/listings/olx.ts`, import actions | M–L | Scraping is our weakest, most copyable, anti-bot-exposed joint. This is the #1 strategic de-risk. |
| 🟠 P1 | **Wire match-explanations into UI/OM** (D1) | recipient picker, OM template, mig `016` | M | Turns matching from a number into a *reason* — the trust differentiator. Data already exists, unused. |
| 🟡 P2 | **Broker "OM aberto" notification** (D2) | open recorder → notify | M | Cheap re-engagement; the standout demo beat. |
| 🟡 P2 | **HTML-escape `investorName`** in email template | `lib/email/om-template.tsx` | XS | Hardening; listing fields already escaped, this one isn't. |
| 🟢 P3 | **Re-enable RLS as defense-in-depth** (currently app-layer `user_id` only) | migrations | L | App-layer filtering verified clean, but RLS is the seatbelt. Lower priority; note for enterprise/security-conscious buyers. |
| 🟢 P3 | **Fresh targeted security scan** (sec-report is a stale 2026-06-03 baseline) | — | S | Don't ship an old "15 CRITICAL" report to a diligence reviewer; re-scan and close the loop. |

---

## 5. Remove / retire — cut the drag

The product pivoted from the legacy `buyers` model to the **investor** model.
Carrying both doubles the surface and confuses every new feature. Cutting dead
weight *is* making the wheel smoother.

| What to remove | Where | Why |
|---|---|---|
| **Legacy `buyers` / `deal_buyers` distribution path** | `record-om-open.ts` (deal_buyers branch), `/om/[id]` deals page, related types | Investor model is the locked decision. Two parallel OM/send systems = bugs + double maintenance. Consolidate on `investor_om_sends` + `/om/listing/[id]`. |
| **Deals-backed public OM page** `/om/[id]` | `app/om/[id]/page.tsx` | Superseded by `/om/listing/[id]`. Keep one public OM route. |
| **Hidden mock/demo location sources** | `lib/location-intelligence` (filtered out by `isReliableNearbyBusiness`) | They're stripped before render — dead UX. Either delete, or convert to clearly-labeled "exemplo" samples for empty states. Don't ship invisible code. |
| **`supabase/.temp/*` in the working tree** | repo root | Add to `.gitignore`; CLI junk shouldn't be tracked. |
| **Scope creep beyond the moat** | roadmap discipline | Anything that isn't source/score/match/OM/track or its data flywheel competes with the residential CRMs on their turf. Don't. |

---

## 6. De-risk — the exposures to watch

- **Sourcing fragility** (biggest): OLX scraping vs Jetimob's official integration;
  Cloudflare anti-bot already observed. → P1 above. A licensed/official feed turns
  a weakness into a barrier.
- **No data moat yet:** scoring + location-intel ride third-party APIs anyone can
  buy. The durable moat is the **investor-preference data** the matching loop
  accumulates — instrument it, learn from send→open→reply feedback.
- **Localization risk:** a funded Buildout/CREXi entering BR erases the category
  gap. Defense = speed + local depth (OLX, pt-BR, BR demographics) they can't
  match quickly.
- **Single-source market numbers:** don't anchor a raise on one report (see
  `market-research.md` §7 — build a bottoms-up corretores × ARPU TAM).

---

## 7. Sequenced plan (Now / Next / Later)

**Now (unblock the moat — days):**
- Resend domain verify (start first, DNS lead time) · hard-fail-without-Resend
  guard · set prod Google key · apply migrations to prod.

**Next (sharpen the differentiators — weeks):**
- Match-explanations into UI/OM (D1) · "OM aberto" notification (D2) · OLX
  official-integration discovery (P1) · retire legacy `buyers`/`deals` OM path.

**Later (deepen the moat — quarter):**
- Investor-preference data flywheel · RLS defense-in-depth · location-intel inside
  the OM as a sales asset · bottoms-up TAM for fundraising.

---

## 8. The one-liner (positioning)

> **"Buildout for Brazilian commercial brokers — but it _finds_ the deal and
> _matches_ the investor, in Portuguese, at a corretor's price."**

Win by polishing the wheel nobody else in Brazil has even built: matching + OM
send/track, made robust and explainable. Don't out-feature the residential CRMs —
out-focus them.

_Appendix / full competitor profiles + sources → `market-research.md`._
