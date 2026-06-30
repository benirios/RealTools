# game.md — RealTools Master Game Plan

_The start-here playbook. What to do, in what order, and which document governs
each step. Everything else hangs off this._

_Author: Opus 4.8 · 2026-06-19 · keep this file current as steps close._

---

## 0. How to read this

This is the **map**, not the territory. Each phase below points to the detailed
document that owns it. Open `game.md` first, follow the arrow to the governing
doc, do the work, check the box, come back.

**Status legend:** ✅ done/verified · 🔧 in progress · ⬜ not started ·
🚫 blocked (needs external/human action).

---

## 1. Document map — what each file is for

| Document | Owns | Read when |
|---|---|---|
| **game.md** (this) | The ordered plan + status across everything | First. Always. |
| `launch.md` | Residual launch gates — only what *can't* be done from code | Before launch; tracking go-live blockers |
| `opusplan.md` | OM distribution loop build spec (investor model) | Touching send/track/OM code |
| `competitive-strategy.md` | Improve / Remove / Double-down plan vs rivals | Prioritizing roadmap work |
| `market-research.md` | Full competitor profiles, matrix, sources, TAM | Positioning, fundraising, competitor questions |
| `codebase.md` | Codebase structure overview | Onboarding / unfamiliar modules |
| `sec-report.md` / `sec-deep-report.md` | Security findings (⚠️ stale 2026-06-03 baseline) | Security review (re-scan first) |
| `handoff.md` / `plan.md` | Earlier session handoffs / original plan | Historical context |
| `.planning/STATE.md` | GSD phase state (live workflow) | Session start (per CLAUDE.md) |
| `graphify-out/` | Knowledge graph of the codebase | "What connects to X?" / tracing deps |

---

## 2. Where we stand (status snapshot — from 2026-06-17 gate audit)

- ✅ **Build green** (`next build` exit 0) · **tests green** (56/56).
- ✅ **Tenant isolation verified** — every service-role query filters by `user_id`;
  public OM pages leak nothing (Gate 1).
- ✅ **OM distribution loop built & traced** — migration `020`, atomic open-recorder,
  `sendOmAction`, email template, listing OM page, recipients UI (Gate 3).
- ✅ **2 fixes already applied** — location-intel `googleMapsApiKey` env wiring;
  `.env.example` Clerk/Resend/Maps keys.
- 🚫 **Launch still blocked** on external items (see Phase 0): Resend DNS, prod
  migrations, prod secrets, OLX prod behavior, live UAT.

**One-line:** the product works in code; it is gated on **ops/external setup**, not
engineering — and the competitive edge is gated on **sharpening 3 existing
features**, not building new ones.

---

## 3. The game — phased steps

### Phase 0 — Unblock launch  → governed by `launch.md` (R1–R5) + `competitive-strategy.md` §4 (P0)
_Goal: a broker can sign up, source/score, send a real OM, and see the open._

- 🚫 **R1 — Verify Resend sending domain** (SPF/DKIM). _Start first — DNS lead
  time of hours._ No verified domain = zero email delivery.
- 🚫 **R2 — Apply migrations to prod DB** (through `021`).
- 🚫 **R3 — Set prod secrets** — Clerk, `RESEND_API_KEY` + `RESEND_FROM_EMAIL`,
  `GOOGLE_MAPS_API_KEY`.
- 🔧 **P0 code — hard-fail `sendOmAction` when Resend is unconfigured**
  (`lib/actions/om-actions.ts`) — stop the silent "✓ enviado" that sends nothing.
- 🚫 **R4 — Confirm OLX ingestion in prod** or launch on a seeded set.
- 🚫 **R5 — Live UAT** end-to-end with a real inbox (depends on R1–R3).

**Exit criteria:** real OM email lands in a real inbox, link opens, open is
recorded and visible in the recipients view.

---

### Phase 1 — Sharpen the differentiators  → governed by `competitive-strategy.md` §3 (D1–D4)
_Goal: make matching + OM the obviously-better thing no BR rival has._

- ⬜ **D1 — "Why this match"** — wire migration `016` strategy-fit /
  match-explanation columns into the recipient picker + OM. _The trust moat._
- ⬜ **D2 — "OM aberto" notification** — react to the `om_opened_at` flip and
  ping the broker. _The standout demo beat._
- ⬜ **D4 — Location intel inside the OM** — surface nearby-business + demographic
  context as a selling asset, not just an internal score.
- ⬜ **D3 — Hold the pricing wedge** — keep pt-BR + SMB pricing explicit; never
  drift to per-seat enterprise.

**Exit criteria:** a broker can see *why* an investor was matched, and gets
notified the moment an OM is opened.

---

### Phase 2 — De-risk + remove drag  → governed by `competitive-strategy.md` §4 (P1) + §5 + §6
_Goal: turn the weakest joints into barriers; delete pivot leftovers._

- ⬜ **P1 — Robust OLX sourcing** — pursue an **official OLX integration / licensed
  feed** (Jetimob has one); keep scraping as fallback + ship a seeded set.
  _#1 strategic de-risk._
- ⬜ **Remove legacy `buyers` / `deal_buyers` path** + the deals-backed `/om/[id]`
  page. Consolidate on `investor_om_sends` + `/om/listing/[id]`.
- ⬜ **Remove hidden mock location sources** (stripped before render = dead UX) —
  delete or convert to labeled "exemplo" empty-states.
- ⬜ **Small hardening** — HTML-escape `investorName` in the email template;
  `.gitignore` `supabase/.temp/*`.
- ⬜ **Fresh security re-scan** (current report is a stale baseline) → update
  `sec-report.md`.

**Exit criteria:** one OM/send system (no legacy), sourcing no longer one
Cloudflare block from breaking, clean security report.

---

### Phase 3 — Deepen the moat + grow  → governed by `market-research.md` §5–§7
_Goal: a data flywheel competitors can't buy, and a fundable story._

- ⬜ **Investor-preference data flywheel** — instrument send → open → reply
  feedback to improve match ranking over time. _The durable moat._
- ⬜ **RLS defense-in-depth** — re-enable Postgres RLS behind the app-layer
  `user_id` filtering (seatbelt for enterprise/diligence buyers).
- ⬜ **Bottoms-up TAM** — corretores × ARPU (don't anchor on the single proptech
  market-size report).
- ⬜ **Re-run competitive verification** — confirm pricing/funding/TAM claims that
  the research harness left unverified (`market-research.md` §0, §7).

**Exit criteria:** matching measurably improves with usage; a defensible TAM +
positioning deck.

---

## 4. Go-to-market & distribution (parallel workstream)

> **Disambiguation:** two things share the word "distribution." The *product's*
> **OM-distribution loop** (send→track, owned by `opusplan.md`) is a feature.
> **This section is market distribution** — how RealTools itself reaches Brazilian
> commercial brokers. Runs in parallel with the build phases above.

**Principle (don't reinvent the wheel):** the cheapest channel is already in the
product. Every OM email + public OM page renders "Desenvolvido com RealTools" —
each send is seen by investors and co-brokers. Turn usage into acquisition before
spending on anything else. Then: **local-first, founder-led, then loops.**

### 4.1 The built-in growth loop (start here — zero marketing cost)
The OM-distribution feature *is* a distribution channel for the company:
- Broker sends OM → investor / co-broker sees the RealTools brand → signs up →
  sends their own OMs. A product-led-growth flywheel that's ~90% already built.
- **Moves (small, in-repo):**
  - Turn the email footer + `/om/listing` footer into a **CTA + link**
    ("Crie o seu OM com RealTools →") — `lib/email/om-template.tsx`,
    `app/om/listing/[id]/page.tsx`.
  - Add a **"compartilhar por WhatsApp"** button on the OM (BR's default comms) —
    extends the loop beyond email.
  - Tag referral signups (`?ref=`/utm) so the loop's viral coefficient is measurable.

### 4.2 Channels (BR-specific, ranked by leverage)
| Channel | How | Cost | Why it works in Brazil |
|---|---|---|---|
| **Built-in OM loop** | Branded OM → recipient signs up | ~0 | Already shipped; every send is reach |
| **CRECI** (regional broker councils) | Partner / sponsor / directory / events | Low | Every corretor is CRECI-licensed → precise targeting |
| **SECOVI + commercial associations** | Credibility, member reach, talks | Low | Owns the commercial-segment audience |
| **WhatsApp** | Broker groups, WhatsApp-first onboarding, share-OM button | ~0 | BR's default business channel |
| **Instagram / YouTube** | Educational content (sourcing comercial, "como montar um OM") | Time | BR brokers live on Instagram |
| **LinkedIn** | Investor/commercial side: FIIs, family offices | Time | Demand-side; pulls brokers in |
| **Feiras / events** | Commercial property summits, local meetups | Med | Face-to-face still closes BR deals |
| **Brokerage networks / franchises** | RE/MAX Commercial, Coldwell Banker Commercial BR | Med | One network = many seats at once |
| **Portal / CRM partnerships** | Official OLX feed, coexist w/ Jetimob/Kenlo | Med | The OLX integration (Phase 2 P1) doubles as a distribution deal |

### 4.3 Networking & founder-led motion (first 90 days)
- **Land 5–10 design-partner brokerages** — high-touch, free, co-build. Target
  commercial-focused brokers in **one city** (e.g. SP corridor: Faria Lima /
  Berrini / Alphaville). Density beats breadth.
- **Build in public:** case studies — "corretor fechou negócio X com RealTools",
  before/after on sourcing time and OM opens.
- **Seed the investor side:** connect with FIIs, family offices, investment clubs.
  Demand pull drags brokers onto the platform.
- **Weekly cadence:** ~10 broker conversations → convert 2 to design partners.

### 4.4 Sequenced (Now / Next / Later — mirrors the build)
- **Now:** switch on the built-in OM loop (footer CTA + WhatsApp share + referral
  tracking) · sign 5 design partners.
- **Next:** dominate one city · one association partnership (CRECI/SECOVI) ·
  content engine (Instagram/YouTube) · WhatsApp onboarding.
- **Later:** brokerage-network deals · portal/CRM integration partnerships · paid
  acquisition — only once CAC < LTV is proven on the organic loop.

### 4.5 Metrics that matter
- **Acquisition:** referral signups from the OM footer · design-partner count · city coverage.
- **Activation:** broker sends first OM (the "aha") · time-to-first-send.
- **Loop health:** OMs sent → recipients → recipient signups = **viral coefficient (k)**.
- **Retention:** weekly active senders.

---

## 5. Operating rhythm (how we execute)

- This project uses **GSD** (`.planning/`). Read `.planning/STATE.md` at session
  start. Use `/gsd-progress`, `/gsd-plan-phase N`, `/gsd-execute-phase N`,
  `/gsd-verify-work` to drive each phase.
- **Critical engineering rules** (from `CLAUDE.md`): server auth via `getUser()`
  never `getSession()`; service-role key server-only; `user_id` filter on every
  service-role query (RLS is off); OM tracking is URL-`?ref`-primary, pixel-secondary.
- Before touching unfamiliar modules, query the knowledge graph
  (`/graphify query "..."`) instead of grepping cold.
- Keep `game.md` honest: when a step closes, flip its box and note the date.

---

## 6. The one-liner we're building toward

> **"Buildout for Brazilian commercial brokers — but it _finds_ the deal and
> _matches_ the investor, in Portuguese, at a corretor's price."**

Win by polishing the wheel nobody else in Brazil has built — matching + OM
send/track, made robust and explainable. Don't out-feature the residential CRMs;
out-focus them.
