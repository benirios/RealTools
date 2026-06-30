# RealTools — Competitive Market Research

_Researcher: Opus 4.8 deep-research harness · 2026-06-18_
_Scope: Brazil-first, global benchmarks. Lenses: CRE deal/OM/CRM · investor-matching/sourcing · AI scoring/location-intel. Framing: product roadmap + investor pitch._

---

## 0. Confidence & method note (read first)

24 sources fetched → 110 claims extracted → 25 sent to adversarial verification.
The harness confirmed **2 claims at 3-0** before the verification + synthesis
stages were cut off by a session limit. The remaining claims are **sourced but
not adversarially verified** — most come from the competitors' **own product
pages (primary sources)**, which are authoritative for "what the product does"
but should be re-checked for pricing/funding/market-size before they go in a deck.

Confidence legend used below:
- **✓✓ verified** — survived 3-0 adversarial vote.
- **✓ sourced** — stated on a primary/company source; high reliability for capability claims.
- **~ directional** — single secondary source; treat as a signal, not a fact.

---

## 1. Executive summary (TL;DR)

- **The category RealTools occupies barely exists in Brazil.** Every mature
  end-to-end CRE deal/OM/send-track platform found is **US/Canada** (Buildout,
  CREXi, Reonomy, Revere, Altrio). The Brazilian players found (DWV, Jetimob,
  Kenlo, QuintoAndar) are **residential-leaning CRMs / portals / developer
  channels** — none do commercial-CRE opportunity scoring + investor matching +
  OM generation + open tracking as one flow.
- **RealTools' wedge = the intersection nobody covers:** local-portal sourcing
  (OLX) + AI opportunity scoring + location intelligence + investor matching +
  OM send-and-track, in **pt-BR, at an SMB-broker price point.**
- **Biggest exposure:** the global incumbents are well-funded and could localize;
  RealTools' moat is local data + workflow fit, not technology, so the moat must
  be **data + distribution**, not features.
- **Where it's thin:** no defensible data asset yet (sourcing depends on scraping
  OLX, which is fragile); investor-matching quality is the real differentiator and
  must be proven.

---

## 2. Competitor matrix (player × capability)

Capabilities: **Src**=local/portal sourcing · **AI**=AI property scoring ·
**Loc**=location intelligence · **Match**=investor/buyer matching · **OM**=OM
generation · **Track**=send + open tracking · **BR**=pt-BR / Brazil-local ·
**Seg**=target segment.

| Player | Geo | Src | AI | Loc | Match | OM | Track | BR | Seg |
|---|---|---|---|---|---|---|---|---|---|
| **RealTools** | 🇧🇷 BR | ✅ OLX | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | SMB broker |
| Buildout | 🇺🇸 US | ⚠️ syndic. | ⚠️ seller-side | ❌ | ❌ | ✅ | ✅ | ❌ | Mid/Enterprise |
| CREXi | 🇺🇸 US | ✅ marketplace | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ❌ | Enterprise |
| Reonomy | 🇺🇸 US | ❌ (data) | ✅ likely-to-sell | ⚠️ data | ❌ | ❌ | ❌ | ❌ | Data/Enterprise |
| Revere | 🇺🇸 US | ❌ | ✅ matchmaking | ❌ | ✅ capital | ❌ | ❌ | ❌ | Institutional (~$20M deals) |
| Altrio (Origin) | 🇨🇦 CA | ⚠️ inbox | ✅ deal scoring | ❌ | ✅ | ❌ | ❌ | ❌ | Investment teams |
| Dealpath | 🇺🇸 US | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | Institutional |
| **DWV** | 🇧🇷 BR | ✅ developer catalogs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Residential primary mkt |
| **Jetimob** | 🇧🇷 BR | ✅ OLX syndic. | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Brokers/imobiliárias |
| **Kenlo / Ville/Tecimob** | 🇧🇷 BR | ✅ syndic. | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Residential CRM |
| **QuintoAndar** | 🇧🇷 BR | ✅ portal | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | Residential rent/buy |
| **Kognita** | 🇧🇷 BR | ❌ | ⚠️ | ✅ geo-intel | ❌ | ❌ | ❌ | ✅ | Retail expansion |

✅ = core marketed capability · ⚠️ = partial/adjacent · ❌ = absent.
Note: every cell for non-RealTools players is from that player's own site or a
review; ⚠️/❌ reflect *what they market*, which can lag what they ship.

**The one-glance takeaway:** RealTools is the only row with ✅ across Src+AI+Loc+Match+OM+Track+BR. No competitor — local or global — fills that whole row.

---

## 3. Per-competitor profiles + weaknesses

### Global benchmarks (validate the category; none serve Brazil)

**Buildout (US)** — the closest functional analog. End-to-end CRE platform: OM/
proposal generation, listing syndication, email campaigns, CRM, pipeline, comps,
transaction/commission management. AI marketing + AI-written descriptions; AI
sourcing is **seller-side** (surfaces likely-to-sell owners).
- _Pricing:_ **from $125/user/month** ✓✓ (premium, per-seat).
- _Weaknesses vs RealTools:_ US-only; **no ML investor/buyer matching, no property
  opportunity scoring, no location intelligence** marketed ✓; per-seat price far
  above BR-SMB willingness-to-pay; no pt-BR / OLX sourcing.

**CREXi (US)** — large US CRE marketplace + broker tooling, all 50 states.
- _Weaknesses:_ US-only, **no pt-BR / local-portal sourcing** ✓; targets enterprise
  (CBRE, JLL, Cushman, Blackstone) ✓ → **SMB/single-broker affordability gap.**

**Reonomy (US)** — CRE data platform, 53M+ US properties; AI/ML "likelihood to
sell" scoring ✓.
- _Weaknesses:_ **US-only data → zero Brazil coverage** ✓. Validates the AI-scoring
  category but proves it's a *data-infrastructure* game RealTools must rebuild
  locally. Not a workflow/OM tool.

**Revere (US)** — capital-markets network, predictive matchmaking between deal
sourcers and capital providers ✓.
- _Weaknesses:_ **institutional, ~$20M average deal** ✓ — wrong segment; no pt-BR,
  no OLX sourcing, no AI scoring, no location intel, no OM gen ✓.

**Altrio / Origin (Canada)** — CRE deal management: source/screen/underwrite/
report; AI captures + scores deals from the **email inbox**; investor/buyer CRM ✓.
- _Weaknesses:_ **inbox-sourced, not portal-sourced** (assumes deals already
  arrive by email — RealTools instead *finds* them on OLX); Toronto, **no Brazil/
  LatAm/pt-BR** ✓; no OM generation marketed.

**Dealpath (US)** — institutional deal-pipeline tool (sources were low-quality;
treat lightly). Enterprise/institutional; no BR presence.

### Brazil incumbents (none are commercial-CRE deal tools)

**DWV (BR)** — connects **developers (incorporadoras) ↔ brokerages**; residential
**primary market** (new developments) ✓.
- _Weaknesses:_ residential, not CRE; sourcing/distribution only — **no AI scoring,
  no location intel, no OM generation, no open tracking** ✓.

**Jetimob (BR)** — real estate management platform: CRM + rental + sales + website;
core value = **portal syndication** (OLX integration, ad packages) ✓.
- _Weaknesses:_ general/residential-leaning CRM/ERP; **no AI scoring, no location
  intel, no investor matching, no OM generation** ✓. _Note:_ Jetimob already has a
  polished **OLX integration** — a reminder RealTools' OLX scraping is a weak,
  copyable moat vs an official integration.

**Kenlo / Ville Imob / Tecimob (BR)** — residential real-estate CRMs (listing +
syndication + site builders). Same gap profile as Jetimob; no CRE deal/OM flow.

**QuintoAndar (BR)** — proptech giant, but **residential rent/buy transactions**,
not a broker deal tool. Adjacent, not competitive.

**Kognita (BR)** — **geographic/location intelligence** for retail expansion —
the one Brazilian player overlapping RealTools' *location-intel* pillar. Not a deal
or OM tool, but a potential future overlap (or partner/acquihire of the data layer).

---

## 4. Whitespace — gaps RealTools can exploit (roadmap framing)

1. **Commercial-CRE-broker workflow in pt-BR is open.** Brazil's tools are
   residential CRMs/portals; the global CRE tools don't speak Portuguese or source
   locally. This is a *category* gap, not a feature gap.
2. **Investor matching is the under-served verb.** Only Revere (institutional) and
   Altrio (inbox) do matching; neither serves BR SMB brokers. RealTools' ranked
   `investor_listing_matches` is the differentiating asset — invest there.
3. **OM generation + open tracking together is rare** outside Buildout (US).
   In Brazil it appears to be **nobody**. Ship it as the headline.
4. **SMB affordability lane is empty.** Buildout $125/seat, CREXi/Revere
   enterprise. A low-priced pt-BR tool owns the long tail of independent
   corretores.
5. **Location intelligence as a CRE underwriting input** (RealTools' nearby-
   businesses + demographics) is a US-data game (Reonomy) and a BR retail-only
   play (Kognita) — nobody combines it with broker deal flow in BR.

## 5. Market sizing + positioning / moat (investor-pitch framing)

**Sizing signals (directional — single sources, verify before the deck):**
- Brazil proptech market **~US$1.12B (2024) → ~US$5.9B (2035), ~16.3% CAGR** ~
  (MarketResearchFuture; a second provider, IMARC, also tracks this market — numbers
  differ, so cite a range, not a point).
- Global proptech/AI CRE funding remains large (multi-$B AI-in-CRE inflows, 2026) ~.
- Brazilian brokerage activity growing but decelerating ~ (Imobi Report).

**Positioning statement (proposed):**
> "Buildout for Brazilian commercial brokers — but it *finds* the deal and *matches*
> the investor, in Portuguese, at a corretor's price."

**Moat thesis (be honest with investors):**
- _Weak moat:_ features (a funded incumbent can localize) and OLX scraping (Jetimob
  has an official OLX integration; scraping is fragile + copyable).
- _Real moat to build:_ (a) **proprietary investor-preference data** from matching
  feedback loops; (b) **BR-local underwriting/location data** that improves with
  usage; (c) **broker workflow lock-in** (the OM send/track history lives here).
  Pitch the data flywheel, not the screens.

## 6. Where RealTools wins / where it's exposed

**Wins**
- Only end-to-end commercial deal flow in pt-BR (source→score→match→OM→track).
- Right segment (SMB corretor) at the right price; incumbents are enterprise/US.
- Investor-matching + open-tracking are differentiators absent from all BR rivals.

**Exposed**
- **Sourcing is fragile:** OLX scraping vs Jetimob's official integration; anti-bot
  risk (already seen — Cloudflare). A data-licensing or official-integration path
  de-risks this.
- **No data moat yet:** scoring/location-intel rely on third-party APIs (Google
  Places) any competitor can buy. Differentiate on the *matching* data you alone
  accumulate.
- **Localization risk:** Buildout/CREXi entering Brazil would erase the
  category-gap advantage; speed + local depth are the defense.
- **Single-source market numbers:** don't anchor a raise on one report — triangulate.

## 7. Recommended follow-up research (after session reset, to verify)

- Re-run adversarial verification on the 23 unverified claims (esp. pricing,
  funding, the BR market-size figure).
- Confirm whether **Kenlo / Loft / Arbo** have any CRE-specific module (sources
  were thin/unreliable this pass).
- Pull **CBRE Brasil / JLL Brasil** institutional-tooling posture (do they have
  broker-facing SaaS that could move down-market?).
- Validate the **Brazil CRE TAM** specifically (the figures found are *proptech*
  broad, not CRE-broker SaaS) — needs a bottoms-up (corretores × ARPU) estimate.

## Sources (24 fetched; primary unless noted)

- Buildout — buildout.com, buildout.com/pricing _(primary; pricing ✓✓)_
- CREXi — credaily.com/reviews/crexi-review _(secondary)_
- Reonomy — reonomy.com/data-coverage _(primary)_
- Revere — reverecre.com/platform _(primary)_
- Altrio — altrio.com/platform _(primary)_
- Dealpath — pricingnow.com (unreliable), motioncre.com (blog)
- Brevitas — brevitas.com/blog (broker tech-stack)
- DWV — site.dwvapp.com.br _(primary)_
- Jetimob — jetimob.com/integracoes/olx _(primary)_
- Kenlo — kenlo.com.br/produtos/imob _(thin)_
- QuintoAndar — getlatka.com/companies/grupoquintoandar _(secondary)_
- Kognita — kognita.com.br/insights/inteligencia-geografica _(blog)_
- Brazil market — marketresearchfuture.com, imarcgroup.com, thesisdriven.com _(secondary)_
- Brokerage trends — imobireport.com.br _(secondary)_
- CBRE Brasil — cbre.com.br/insights _(primary)_
- AI-in-CRE context — growthfactor.ai, theaiconsultingnetwork.com _(blogs)_
