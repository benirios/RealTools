# europe.md — RealTools Europe Expansion

_The full process — market research → launch plan → strategy → distribution —
re-run for **Europe**. Companion to the Brazil docs (`market-research.md`,
`launch.md`, `competitive-strategy.md`, `game.md`)._

_Researcher: Opus 4.8 deep-research workflow (4 cited agents) + synthesis · 2026-06-20_
_Scope: Europe (UK + EU-27). Lenses: CRE deal/OM/CRM · investor-matching/sourcing · AI scoring/location-intel. Framing: product roadmap + investor pitch._

---

## 0. Confidence note (read first)

Built from a 4-agent cited research pass (competitors · sourcing portals ·
GDPR/ePrivacy law · market+GTM). Capability claims come mostly from **primary/
company sources** (high confidence). **Market-size figures are single-source
vendor estimates with wide variance — directional only.** Legal findings cite
official DPA/regulator guidance (EDPB, CNIL, Italian Garante, UK ICO) and are
**time-sensitive** (the rules are mid-migration in 2026 — see §4).

---

## 1. Executive summary (o resumo)

Europe is the same *opportunity shape* as Brazil — **no all-in-one, SMB-priced,
localized tool does source → AI-score → location-intel → investor-match → OM →
track** — but a **harder game to enter**, for three reasons:

1. **The category gap is real and confirmed.** The European stack is split into
   point tools: CoStar/LoopNet (listings+data), Buildout (OM+CRM, *US-only*),
   Forbury (underwriting), Dealsuite/Consorto/BrickVest (matching, *M&A/
   institutional*), PriceHubble/Datscha/Geoblink (scoring/location-intel, often
   *single-country*, consolidating into MSCI/MyTraffic/Altus). **None bundle the
   whole flow for an SMB broker.**
2. **GDPR/ePrivacy reshapes the product, not just the legal page.** RealTools'
   signature move — *email an OM and track the open via a pixel* — is **unlawful
   in the EU as built**: the tracking pixel needs **prior consent** (ePrivacy Art
   5(3)); 2026 guidance from CNIL and the Italian Garante **explicitly rejects
   legitimate interest** for marketing pixels. The product must add a consent +
   opt-out + auditable-logging layer before a single OM goes out in the EU.
3. **Sourcing must be re-architected.** There is no single OLX. Europe is 1–2
   portals per country, mostly **scraping-hostile**, with shared official feeds
   that are *inbound* (agents push in), not *outbound* (you pull out). The
   single-scraper BR pipeline does not port.

**Recommendation: enter the UK first.** English (zero localization tax vs the
current pt-BR), highest PropTech adoption, one dominant professional body (RICS,
113k members) as a distribution channel, London the top European proptech-funding
hub, and a clear commercial portal (LoopNet/CoStar) to partner with. Then layer
Southern Europe via **Idealista's official API** (ES+IT+PT in one), then DE/AT via
**ImmoScout24's API** + Expo Real.

---

## 2. Competitive market research

### 2.1 Competitor matrix (player × capability)

Capabilities: **Src** local-portal sourcing · **AI** property scoring · **Loc**
location intel · **Match** investor matching · **OM** OM generation · **Track**
send+open tracking · **Local** EU-language / multi-country fit.

| Player | Geo | Src | AI | Loc | Match | OM | Track | Local | Segment |
|---|---|---|---|---|---|---|---|---|---|
| **RealTools (EU target)** | EU | ✅* | ✅ | ✅ | ✅ | ✅ | ⚠️ (consent) | ⚠️ (pt-BR→needs EN) | SMB broker |
| CoStar / LoopNet / Realla | UK+EU | ✅ data | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | Enterprise/data |
| Buildout | 🇺🇸 US | ⚠️ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ❌ (no EU) | Mid/broker |
| VTS | US+UK | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ | Enterprise landlord |
| Re-Leased | UK/global | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Property mgmt |
| Forbury (Altrus) | EMEA | ❌ | ⚠️ underwriting | ❌ | ❌ | ❌ | ❌ | ✅ | Underwriting |
| Dealsuite | 🇳🇱 pan-EU | ❌ | ❌ | ❌ | ✅ M&A | ❌ | ❌ | ✅ | M&A advisors |
| Consorto | 🇳🇱 pan-EU | ⚠️ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ✅ | Institutional CRE |
| BrickVest | UK/DE | ❌ | ❌ | ❌ | ✅ capital | ❌ | ❌ | ✅ | Institutional (€5–250M) |
| PriceHubble | 🇨🇭 11 mkts | ❌ | ✅ AVM | ✅ | ❌ | ❌ | ❌ | ✅ | Banks/enterprise |
| Datscha (MSCI) | SE/FI/UK | ⚠️ off-mkt | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | Institutional data |
| Geoblink (MyTraffic) | ES/~10 | ❌ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ✅ | Retail/expansion |
| Sprift / CompStak | UK / EU | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | Data feed |

`*` = aspirational; requires the per-country sourcing rebuild (§3). ✅ core · ⚠️ partial/conditional · ❌ absent.

**One-glance takeaway:** as in Brazil, RealTools is the only row that *attempts*
the full source→score→match→OM→track flow. No EU player fills it — but two cells
turn from ✅ to ⚠️ on crossing the border: **Track** (pixel needs consent) and
**Local** (pt-BR → must localize, EN-first).

### 2.2 Per-competitor weaknesses (three silos)

**Silo A — Listings/data + OM/CRM (closest, but never the whole flow):**
- **CoStar / LoopNet / Realla** — #1 CRE data + marketplace; bought Realla (UK,
  2018). _Weakness:_ enterprise data/marketplace giant — **no SMB OM generation,
  no CRM-driven matching, no open tracking.** [costargroup.com]
- **Buildout** — the functional twin (listings, CRM, OM/proposal gen). _Weakness:_
  **US-only, no EU presence, no local-portal sourcing, no AI scoring/location
  intel.** [buildout.com]
- **VTS / Re-Leased** — leasing/asset-mgmt and property management. Wrong persona
  (enterprise landlord / portfolio ops), not the broker sell-side flow.
- **Forbury** — CRE underwriting/modeling (now Altus/ARGUS). One tab in the stack;
  no sourcing/CRM/OM/match/track. [forbury.com]

**Silo B — Investor matching (only the matching step, skews up-market):**
- **Dealsuite** (NL) — dominant EU deal-sourcing network, 1,500+ firms, 60+
  countries. _Weakness:_ **M&A (companies), not CRE; matching only** — no sourcing/
  OM/scoring/tracking. [dealsuite.com]
- **Consorto** (NL) — EU CRE investor-matching marketplace. _Weakness:_
  **institutional-grade assets, marketplace only.** [consorto.com]
- **BrickVest** (UK/DE, PATRIZIA) — €5–250M institutional club deals. Opposite of
  SMB mid-market. [brickvest.com]

**Silo C — AI scoring / location intel / valuation (data tools, single-country):**
- **PriceHubble** (CH, 11 markets) — Europe's leading AI valuation + block-level
  location analytics. _Weakness:_ **residential-leaning data API sold to banks; no
  CRE workflow.** Best *partner-or-match* target for the scoring layer. [pricehubble]
- **Datscha** (Nordics/UK, MSCI) — CRE market intelligence, single-region,
  analysis-only, now inside an enterprise giant. [datscha.co.uk]
- **Geoblink** (ES, MyTraffic) — retail location intel; not a brokerage flow.
- **Sprift / CompStak** — UK property-data reports / lease comps. Inputs, not
  workflows.

### 2.3 The gap (whitespace)

No all-in-one, **SMB-priced**, **per-country-localized** (portal + language)
product does sourcing + AI scoring + location intel + CRM matching + OM generation
+ (consent-aware) open tracking. Incumbents are either **single-country**,
**enterprise-priced**, or **point tools consolidating into giants**. That
integration — plus per-country sourcing and localization — is RealTools' EU moat.

---

## 3. Sourcing in Europe — the "OLX problem" re-architected

**Brazil = one OLX to scrape. Europe = a dozen national portals, mostly closed.**
Official feeds are *inbound* (agents push listings in via licensed software), not
*outbound* extraction APIs. The single-scraper pipeline does not port.

| Country | Portal(s) | Commercial? | Pull access | Note |
|---|---|---|---|---|
| UK | Rightmove / Zoopla | yes (resi-led) | ❌ inbound BLM/XML feed only | scraping breaches ToS |
| UK (commercial) | **LoopNet/Realla** (CoStar), NovaLoca | ✅ specialist | 💷 licensed | deepest data, paywalled |
| DE/AT | **ImmoScout24** | ✅ Gewerbe segment | ⚠️ official API, partner-gated ("not for data-delivery") | strong but approval-gated |
| ES/IT/PT | **Idealista** | ✅ incl. offices | ✅ **official Search API (OAuth2)** | **most open major — one integration = 3 markets** |
| FR | SeLoger / Leboncoin | yes | ❌ no outbound API | **no shared property ID → needs dedup** |
| FR (commercial) | **BureauxLocaux** (CoStar) | ✅ specialist | 💷 licensed | 90%+ of top FR commercial brokers |
| NL | Funda → **FundaInBusiness** | ✅ separate site | ❌ NVM-member feeds | commercial on a distinct domain |
| IT | Immobiliare.it (+ idealista.it) | ✅ | ⚠️ partner-gated API | Idealista covers IT too |
| SE | Hemnet | thin commercial | ❌ no open API | weak for commercial sourcing |

**Architecture implication (the real work):**
1. **Per-country sourcing adapter layer** — official APIs where tolerant (Idealista
   ES/IT/PT, ImmoScout24 DE/AT), licensed commercial data (CoStar/LoopNet/
   BureauxLocaux), agent/member inbound feeds (UK BLM), selective scraping only
   where low-risk.
2. **Cross-portal entity-resolution / dedup engine** — no shared property ID; the
   same asset appears on residential + specialist portals under different IDs.
   Fuzzy-match on address/surface/price/rooms.
3. **GDPR for agent contact PII from day one** — scraped agent details are personal
   data (see §4).

**Sequencing:** anchor on **Idealista's official API** (lowest legal risk, 3
markets in one) for a Southern-Europe wedge, **or** UK via a CoStar/agent-feed
partnership for the English-first beachhead. Scraping = prototyping only, never the
production backbone (the BR lesson, amplified by stricter EU enforcement).

---

## 4. Legal gate — GDPR / ePrivacy (the EU-only blocker that doesn't exist in BR)

This is the section with no Brazil equivalent and the one that can sink the launch.
**RealTools' core loop survives transplant only with material rework.**

### 4.1 The tracking pixel is the headline problem
- **Open-tracking pixel ⇒ prior CONSENT (ePrivacy Art 5(3)).** A 1×1 pixel
  accesses the recipient's device → consent required; a GDPR legitimate-interest
  basis **cannot** override the separate ePrivacy consent rule. [insideprivacy]
- **CNIL (France), eff. 14 Apr 2026:** "opening an email isn't an action that
  signals consent to tracking" — legitimate interest **won't cover** marketing
  pixels. Requires: layered disclosure, **separate consent per purpose**, a
  tracking opt-out link **independent of unsubscribe**, consent **before** pixels
  fire, timestamped consent records. [uniconsent / CNIL]
- **Italian Garante (Provision 284, Apr 2026):** performance/marketing pixels need
  **prior consent + prior information**; granular withdrawal. [insideprivacy]
- **⇒ Product change:** the pixel **cannot be on-by-default** in the EU/UK. Gate it
  behind per-recipient consent, or disable it for EU/UK recipients and lean on the
  URL `?ref` token.

### 4.2 The URL ref-token is more defensible (lean on it)
- A `?ref=` click doesn't store/access info on the device the way a pixel does, so
  it sits **less squarely** under ePrivacy — but building an engagement profile of
  a named investor is still GDPR profiling, where the EDPB says legitimate interest
  "is unlikely to yield a positive result." [EDPB LI guidelines]
- **⇒ Product change:** keep the `?ref` token as the **primary** signal (it already
  is, per `CLAUDE.md`), **disclose it**, honour opt-out — never market it as
  "invisible."

### 4.3 Sending the OM email
- **UK PECR:** B2B email to **corporate** subscribers (Ltd/LLP/public bodies)
  needs **no prior opt-in** — a broker *can* cold-email these — but identity +
  valid opt-out are mandatory, and it does **not** cover **sole traders / personal
  addresses / named individuals** (consent required). [ICO]
- **EU:** **no blanket B2B exemption.** Cold outreach rides on a documented
  **Legitimate Interest Assessment** (3-step EDPB test); relevance to the
  recipient's professional role matters. [EDPB]
- **⇒ Product change:** add a **contact-classification field** (corporate entity vs
  sole trader vs personal address) that routes individuals into a consent-required
  workflow; ship an **LIA template**; distinguish **opted-in deal-flow recipients**
  from **cold prospects** (the former is materially lower-risk for both send + track).

### 4.4 The investor CRM + processor chain
- CRM = personal data: documented **lawful basis** per contact, **Art 14 source
  disclosure** (esp. portal-scraped/enriched data), **DSAR/erasure/portability**
  that **cascades** across Supabase + Resend + enrichment, defined retention,
  72-hour breach reporting. [gdprlocal]
- **Art 21(2) right to object** = absolute, no balancing — object ⇒ **stop all
  marketing + tracking permanently**, surfaced at first contact. ⇒ durable
  suppression list.
- **Art 28 DPAs + SCCs/TIA** with Supabase/Resend/Vercel; choose **EU regions**;
  note US CLOUD Act / Schrems II residual risk even in EU regions. [Supabase TIA]
- **Enforcement is severe & provability-driven:** UK DUAA 2025 raised the PECR cap
  to **£17.5m / 4% of turnover**; most 2025 fines were for **inability to produce
  consent records**, not absence of consent. ⇒ **auditable, timestamped, per-
  purpose consent + opt-out logging is a first-class feature.** [tdp.agency]

### 4.5 Moving target
ePrivacy Regulation **withdrawn 11 Feb 2026**; tracking rules migrating into GDPR
via the Digital Omnibus (Arts 88a/88b) while consent stays the rule. **Design to
the strictest common denominator** (prior, granular, withdrawable consent) so the
product stays compliant as rules consolidate. [nixondigital]

---

## 5. Launch plan — Europe gates

Mirrors `launch.md` but adds a **Gate L (Legal)** that gates everything, and a
**heavier sourcing gate** (build, not scrape). Status: ⬜ not started · 🚫 needs
external/legal/prod action.

### Gate L — Legal / compliance · **blocks any EU send** (NEW, no BR equivalent)
- 🚫 Consent + opt-out layer: per-recipient tracking consent, tracking opt-out link
  **separate** from unsubscribe, auditable timestamped per-purpose consent store.
- 🚫 Pixel off-by-default for EU/UK; `?ref` token as disclosed primary signal.
- 🚫 Contact classification (corporate vs individual) + LIA workflow for cold email.
- 🚫 CRM data-rights: DSAR/erasure cascade across Supabase/Resend; Art 14 notice;
  retention policy; Art 21(2) absolute suppression list.
- 🚫 DPAs + SCCs/TIA with Supabase/Resend/Vercel; **EU data regions**; privacy notice.

### Gate 0 — Clean foundation
- ⬜ Localize to **English (UK-first)** — the product is pt-BR; EN removes the
  biggest entry cost. i18n scaffold for later DE/FR/ES.
- ⬜ EU infra regions + the Brazil Gate-0 hygiene (build/tests/env) carried over.

### Gate 1 — Security / tenancy
- ✅ Tenant isolation pattern (verified in BR audit) carries over; re-verify under
  EU data-residency + add data-rights tooling.

### Gate 2 — Sourcing (heavier than BR)
- 🚫 Build the **per-country adapter** for the first market (Idealista API *or* UK
  feed/partnership) + the **cross-portal dedup engine**. Not a single scraper.

### Gate 3 — Distribution loop
- ✅ Send/track loop already built (BR) — but **rework for Gate L** (consent-aware
  tracking) before EU use.

### Gate 4 — Live UAT
- 🚫 End-to-end with a real UK/EU broker + a consenting investor inbox; confirm the
  open records **only after consent**, and opt-out suppresses.

---

## 6. Competitive strategy for Europe (Double-down / Improve / Remove)

**Double-down (the EU-unique wins):**
- **The all-in-one flow for SMB brokers** — nobody in EU has it; incumbents are
  point tools or enterprise.
- **Investor matching + OM** — only Dealsuite/Consorto match (M&A/institutional);
  none generate OMs for SMB brokers.
- **English-first speed** — ship UK before continental rivals localize.

**Improve (smooth the joints for EU):**
- **Consent-aware tracking** (Gate L) — turn the compliance constraint into a trust
  feature ("GDPR-native deal tracking" is a *selling point* to EU brokers).
- **Per-country sourcing adapters + dedup** — the real engineering lift; start with
  Idealista (3 markets, one API).
- **Match-explanations** (already valuable in BR) — even more so for EU
  institutional-adjacent investors who demand rationale.
- **Partner the scoring/location layer** — consider PriceHubble/Geoblink data
  partnerships rather than rebuilding EU location-intel from scratch.

**Remove / avoid:**
- **Default scraping as the production backbone** — ToS-fragile + GDPR-exposed in
  EU. Adapter/partnership model instead.
- **Pixel-first tracking** — retire as the primary signal for EU; ref-token + consent.
- **Multi-country-at-once ambition** — sequence one market at a time; fragmentation
  punishes breadth-first.

---

## 7. Go-to-market & distribution (Europe)

**Principle (same as BR):** the branded OM is a built-in growth loop — every OM is
seen by recipient investors, **arguably stronger in EU** where cross-border
investors at MIPIM / on LinkedIn receive OMs from many brokers. Make it subtly
"Made with RealTools" (consent-compliant) to convert recipient-exposure into broker
signups.

**Channels (ranked, UK-first):**
| Channel | How | Why EU |
|---|---|---|
| **Built-in OM loop** | Branded, consent-aware OM → recipient sees RealTools | ~0 cost; portable + stronger cross-border |
| **RICS** (113k members) | Accreditation/sponsorship, CPD content, member directory | **One body reaches the whole serious UK broker base** |
| **Expo Real** (Munich, ~42k visitors, 1,780 exhibitors) | Demo/launch + recruit DE design partners | Largest EU CRE trade fair |
| **MIPIM** (Cannes, ~20k, 90+ countries) | Investor/capital side of the two-sided pitch | #1 cross-border deal-making event |
| **LinkedIn** | Investor/CRM side outreach + content | De-facto EU channel for the buy side |
| **LoopNet/CoStar & country portals** | Sourcing partnership that doubles as distribution | Gatekeepers — partner not fight |
| **Country broker associations** | Second-wave DE/FR/ES local GTM | Fragmented; needed for continental push |

**Founder-led motion (first 90 days, UK):** 5–10 design-partner brokerages in
London; build-in-public case studies (sourcing time, OM opens *with consent*); seed
the investor side via LinkedIn + MIPIM; ~10 broker conversations/week.

---

## 8. Market sizing + positioning / moat (investor framing)

**Sizing (mix of primary + directional):**
- **European CRE investment 2025 = €241bn (+13% YoY)** — CBRE, primary. Deal flow
  that generates OMs is large and recovering. [cbre.co.uk]
- **Europe proptech ≈ $11–13bn, ~16–19% CAGR** — single-source vendor estimates,
  *wide variance, directional only*; commercial/industrial is the fastest segment.
- **Broker base (SMB ICP):** FR ~64.8k agencies · DE ~32.3k · UK ~25.8k firms
  (~55.5k individual agents). Large addressable long tail in every major country.
- **Funding:** EU proptech €406M in Q1 2025 (63% seed); **London ($340M) + Berlin
  ($180M)** the hubs; **AI is the defining funding filter** — RealTools' AI-scoring +
  AI-OM positioning fits, and London-first aligns customers *and* capital.

**Positioning statement (proposed):**
> "Buildout for European SMB commercial brokers — it *sources* the deal, *matches*
> the investor, and tracks the OM **GDPR-natively**, in your language, at a broker's
> price."

**Moat thesis (honest):**
- _Weak moat:_ features (a funded incumbent can copy) and scraping (ToS/GDPR-fragile).
- _Real moat:_ (a) **GDPR-native consent + audit** as a trust wedge EU buyers
  demand; (b) **per-country sourcing adapters + dedup** = a costly-to-replicate
  integration layer; (c) **investor-preference data flywheel** from
  send→consented-open→reply; (d) **English-first speed** to the UK before rivals.

---

## 9. Where RealTools wins / where it's exposed (EU)

**Wins**
- Only all-in-one SMB CRE flow in a fragmented, point-tool market.
- Investor-matching + OM where rivals do at most one.
- Compliance-as-feature: "GDPR-native deal tracking" is a credible differentiator.

**Exposed**
- **Legal:** the core tracking mechanic is unlawful as built — Gate L is mandatory,
  not optional, and rules are shifting (2026).
- **Sourcing:** no OLX; per-country build + CoStar gatekeeping; scraping risk is
  higher than in BR.
- **Localization tax:** pt-BR → must localize (UK-English first mitigates).
- **Incumbent consolidation:** scoring/data layers are being absorbed by MSCI/
  MyTraffic/Altus/CoStar — partner early or get boxed out of data.
- **Single-source market numbers** — triangulate before the deck (bottoms-up:
  brokers × ARPU per country).

---

## 10. Sequenced plan + recommended first market

**Recommended beachhead: United Kingdom.** English (no localization tax), top
PropTech adoption, RICS as a single distribution channel, London = top funding hub,
LoopNet/CoStar as the commercial portal to partner. Southern Europe (Idealista API:
ES+IT+PT) is the natural *second* wedge; DE/AT (ImmoScout24 + Expo Real) third.

- **Now:** legal design (Gate L) + EN localization + pick beachhead + EU infra
  regions + Idealista/CoStar sourcing-partnership discovery.
- **Next:** build the first per-country sourcing adapter + dedup; rework tracking to
  consent-aware; 5 UK design partners; RICS + LinkedIn motion.
- **Later:** second market (Idealista 3-in-1), Expo Real/MIPIM presence, scoring-
  data partnership (PriceHubble/Geoblink), investor-preference flywheel, bottoms-up
  TAM for fundraising.

---

## 11. Sources (primary unless noted)

- Competitors: costargroup.com, buildout.com, vts.com, re-leased.com, forbury.com,
  dealsuite.com, consorto.com, brickvest.com, pricehubble (bestcre.com review),
  datscha.co.uk, geoblink.com, sprift.com.
- Portals: estateagentfeeds.com (Rightmove RTDF), kremersigns.co.uk (Zoopla),
  api.immobilienscout24.de, developers.idealista.com, real-estate-api.net (FR),
  apify.com (Funda/Hemnet), geonode.com (Immobiliare), novaloca.com, webscraping.ai.
- Legal: insideprivacy.com (Italian Garante), uniconsent.com (CNIL),
  edpb.europa.eu (LI guidelines), ico.org.uk (PECR B2B), gdpr-info.eu (Art 21),
  gdprlocal.com (CRM), supabase.com (TIA), tdp.agency (PECR fines), nixondigital.io
  (Digital Omnibus).
- Market/GTM: cbre.co.uk (€241bn 2025), marketdataforecast.com (proptech, *low
  conf*), statista.com / IBISWorld (broker counts), mordorintelligence.com (no MLS),
  rics.org (113k), expo-real (realassetinsight.com), mipim.com, creti.org (Q1 2025
  funding).

_Companion docs: `market-research.md` (Brazil), `game.md` (master plan)._
