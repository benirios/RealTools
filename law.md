# RealTools — EU Legal-Risk Assessment

**⚠️ This document is not legal advice.** It is an engineering-led, code-grounded risk assessment intended to scope and prioritise compliance work. Every conclusion below — especially any reliance on the EU–US Data Privacy Framework, on legitimate-interest bases, or on a controller/processor characterisation — must be confirmed by qualified EU (and Brazilian/LGPD) counsel before RealTools relies on it. Severity ratings reflect a verifier-corrected internal view of exposure, not a legal opinion.

---

## 1. TL;DR

**Territorial verdict: No EU law applies to RealTools today.** The product is a Brazil-first B2B commercial-real-estate tool — PT-BR UI, BRL pricing, `countrycodes=br` geocoding, OLX/IBGE data sources. There is **no EU establishment** (GDPR Art 3(1)) and **no targeting of EU data subjects** (Art 3(2)). The binding regime now is **Brazil's LGPD**. GDPR, ePrivacy, the AI Act, the DSA and the Database Directive are **conditional on expansion triggers**:

- **Art 3(1)** — onboarding an EU-based broker tenant / opening an EU office.
- **Art 3(2)(a)** — deliberately marketing to EU brokers or investors.
- **Art 3(2)(b)** — the sharpest accidental edge: a forwarded, public OM link (`/om/...?ref=[token]`) opened on EU terminal equipment triggers behavioural monitoring of an EU data subject.

Because LGPD is ~80% congruent with GDPR, **building to LGPD now buys most of GDPR readiness**. The genuinely "now" items below are LGPD duties and one regime-agnostic security issue — fix those regardless of EU plans.

### Top 5 risks (by corrected severity)

| # | Risk | Regulation (article) | Corrected severity | Trigger |
|---|------|----------------------|--------------------|---------|
| 1 | Service-role Supabase client bypasses RLS (disabled in mig 019); tenant isolation rests solely on app-layer `user_id` filtering — a single missed filter leaks one broker's investor financial profiles to another | GDPR Art 5(1)(f), 32, 25; **LGPD Art 46/49** | **High** | **Now** (security, regime-agnostic) |
| 2 | Latent/undisclosed sub-processor: code defaults to **OpenRouter** (`google/gemini-flash-1.5`) while `.env.example` documents `gemini` — config-vs-docs drift means production may use an undocumented US LLM router | GDPR Art 28(2)/(4), 30; **LGPD Art 39** | Medium | **Now** (config drift) |
| 3 | No privacy notice anywhere in the product (brokers, buyers, investors, scraped third parties) | GDPR Art 13/14; **LGPD Art 9 / Art 6(VI)** | Medium | **Now** (LGPD) |
| 4 | AI prompt contents sent to US LLM endpoints with no verified no-training / retention / processor terms | GDPR Art 28; **LGPD Art 39 / Art 33** | Medium | **Now** (LGPD governance) |
| 5 | No Records of Processing / sub-processor inventory; the processor chain is only discoverable by reading code | GDPR Art 30; **LGPD Art 37** | Medium | **Now** (LGPD) |

> Note: items 2–5 are all readily-remediable governance/documentation gaps. Item 1 is the one piece of genuine, live, architecture-level risk and should be treated as the priority.

---

## 2. Territorial scope — when EU law applies

| Regime | Status today | What flips it on |
|--------|--------------|-----------------|
| **GDPR** (Reg 2016/679) | **N/A** | Art 3(1) EU establishment/tenant; Art 3(2)(a) marketing to EU; Art 3(2)(b) tracking an EU-located OM recipient |
| **ePrivacy** (Dir 2002/58 Art 5(3)/13) | **N/A** | An OM open-tracking beacon/pixel firing on EU terminal equipment; marketing email to an EU recipient |
| **Chapter V transfers** (Art 44–49) | **N/A** (these are Brazil→US flows under **LGPD Art 33**) | Any Art 3 trigger turns each US flow (Supabase, Clerk, Resend, Google, Gemini/OpenRouter, Vercel) into a restricted transfer needing SCCs or EU–US DPF reliance |
| **AI Act** (Reg 2024/1689) | **N/A** | EU market placement; Art 50 labelling for the **LLM summaries** (rule-based scoring stays out of scope) |
| **DSA** (Reg 2022/2065) | **N/A** | RealTools becoming a public, EU-facing hosting/intermediary platform (it is not — closed B2B, first-party content) |
| **Database Directive** (96/9/EC) | **N/A** | Scraping an **EU-established** database maker's DB *and* extracting within the EU |
| **Consumer Rights / UCPD** | **N/A** | A B2C transactional surface (checkout, consumer sign-up) — none exists |
| **LGPD** (Lei 13.709/2018) | **BINDING NOW** | — |

On expansion, GDPR *adds* (does not replace LGPD): an **Art 27 EU representative**, formal **Art 30 records**, a likely **Art 35 DPIA**, **ePrivacy consent**, **AI Act Art 50** labelling, and **SCC/DPF transfer paper**.

---

## 3. Personal-data inventory

| Subject | Where it lives | Key fields | Collected / inferred | Special-category risk |
|---------|----------------|-----------|----------------------|-----------------------|
| Broker users (tenants) | `user_id TEXT` on ~all tables; Clerk identity | email, Clerk userId, IP/device (Clerk default) | Collected | Low (minimal schema) |
| Investors / clients | `investors`, `client_opportunities`, `investor_om_sends` | name, email, phone, budget_min/max, desired_yield, strategy, risk_level, preferred_neighborhoods, free-text notes, open events | Collected + behavioural | Free-text notes; financial-robustness profiling |
| Buyers | `buyers`, `deal_buyers` | name, email, tags, tracking_token, om_opened_at | Collected + behavioural | Low |
| Third parties in listings | `listings.description`, `address_text`, `raw_payload`, `source_url` | seller names/phones, addresses (scraped from OLX) | Captured (no consent, no notice) | Free-text body can sweep Art 9 data |
| Nearby businesses | `location_insights.nearby_businesses` | sole-proprietor business names/addresses | Collected (Google Places — dormant, no key) | Low |
| Area demographics | `location_insights` | avg_income, population_density, consumer_profile | **Inferred / sometimes fabricated** (`buildMockDemographicEstimate`) | Income proxy → race/ethnicity theory (attenuated, area-level) |
| Investor match profiles | `investor_listing_matches` | match_score, confidence, breakdown, recommended_action | **Inferred (profiling)** | Financial-vulnerability classification |
| AI summaries | `listing_ai_summaries` | LLM text (sent to Gemini/OpenRouter, US) | **Inferred** (`investorName` nulled before send — good) | Address+income leave platform |

---

## 4. Findings by feature

Severities are **verifier-corrected**. Findings the verifier marked **not-applicable** (and clearance findings corrected to **none**) are in the Appendix. Within each feature, rows are ordered by corrected severity.

### 4.1 Authentication & Account (Clerk)

*Auth/account data is genuinely minimal — the one bright spot. GDPR does not apply today; the live regime is LGPD. Several gaps are also present-day LGPD duties.*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| Clerk processes account identity in US with no transfer mechanism | Chapter V Art 44, 46(2)(c) / 45 (DPF) | Medium | On-expansion | Each auth event becomes a restricted transfer; worst case suspension | Verify Clerk DPF cert or fall back to SCC-DPA; pin Supabase to EU region; document TIA in Art 30 record | Clerk/Google/Resend are credible DPF adequacy candidates → possibly no SCCs needed |
| No privacy notice / policy presented at signup | Art 13(1)-(2) | Medium | On-expansion | Bare `<SignUp/>`; zero Art 13 disclosure of controller, purposes, recipients, retention, rights | Publish bilingual policy, link via Clerk privacy-URL config (do now for LGPD Art 9) | Clerk dashboard supports privacy-URL + consent checkbox — low-effort |
| No erasure cascade on account close — Clerk deletion orphans PII in Supabase | Art 17, 5(1)(e), 28(3)(g) | Medium | On-expansion | No `user.deleted` webhook; mig 019 makes `user_id` the only tenant key; orphaned investor/buyer PII | Svix-verified `user.deleted` webhook → defined retention/anonymisation cascade; self-service delete | Backend service-role deletion always available; broker may be controller of investor data with own retention basis |
| No Art 28 processor agreement on record for Clerk/Supabase | Art 28(3), 28(2)/(4) | Low | On-expansion | Paperwork to stage; no GDPR controller relationship exists today | Execute Clerk/Supabase standard DPAs (SCC modules) before EU onboarding | Both publish click-through SCC-incorporating DPAs |
| Profile page read-only — no self-service access/rectification/erasure | Art 15–20 | Low | On-expansion | GDPR imposes no in-product portal duty; DSAR can be manual | Mount Clerk `<UserProfile>`; publish DSAR contact | Art 12(3) satisfiable by manual process + published contact |
| Account-data collection is minimal (privacy-by-design positive) | Art 25, 5(1)(c) | Low | On-expansion | Minimal; only watch item is Clerk default IP/device telemetry | Document Clerk IP/device under Art 6(1)(f); no code change | Security telemetry = textbook legitimate interest; minimal schema is strong Art 25 evidence |
| Dead Supabase auth-callback code muddies data-flow record | ePrivacy Art 5(3); Art 30 | Low | On-expansion | Auth cookies are strictly-necessary (exempt) — no banner needed; orphaned `exchangeCodeForSession` route is hygiene smell | Delete orphaned route; record auth cookies as exempt in cookie inventory | Strictly-necessary exemption is genuine leeway |

### 4.2 Deal Management, Notes & File Storage

*Internal broker-workspace data; narrower territorial bridge. Live regime LGPD.*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| Free-text notes accept unconstrained personal/special-category data | Art 5(1)(c), 6, 9; LGPD Art 7/11 | Medium | On-expansion / LGPD now | `NoteSchema` = `z.string().min(1)`; same in investors/client_opportunities notes | In-product notice discouraging sensitive data; document LI basis now; DPIA on expansion | Free-text CRM is industry norm; legitimate context has Art 6(1)(f)/LGPD Art 7(IX) cover — basis exists, just undocumented |
| No retention limit / storage-limitation policy; erasure manual, no subject pathway | Art 5(1)(e), 17; LGPD Art 15/16/18(VI) | Medium | On-expansion / LGPD now | No TTL/purge; manual per-record deletion; within-document erasure impossible | Retention schedule keyed to deal status; deletion routine; LGPD erasure process now | Purpose-bound retention for active deals defensible; closed deals are the weak point |
| No DPA (Art 28) with broker tenants whose clients' data is stored | Art 28, 26; LGPD Art 39 | Medium | On-expansion / LGPD now | Missing processor contract is an infringement for both parties (Art 83(4)) | Draft reusable DPA/operador addendum; execute before EU onboarding | Highest-leverage fix — DPA disposes of Art 14/DSAR/lawful-basis duties too |
| Uploaded files contain third-party PII; no Art 14 notice | Art 14, 6, 5(1)(a); LGPD Art 9 | Low | On-expansion | **Art 14 is a controller duty — sits with the broker, not RealTools (processor)**; processors have no transparency duty | Allocate Art 14 to broker in DPA; upload guidance; no content scan | Self-defeating as a RealTools finding — handled by the DPA item |
| Signed-URL / public-URL file exposure (forwardable tokens, public OM images, PII filenames) | Art 5(1)(f), 32, 25; LGPD Art 46 | Low | On-expansion | 1-hr signed URLs are by-design; `om-images` is intentionally public marketing photos | Use opaque object IDs not PII filenames; confirm `om-images` excludes documents | Signed URLs working as designed; gray_area admits "largely fine" |
| Deal/account deletion leaves orphaned storage files | Art 17, 5(1)(e); LGPD Art 16 | Low | On-expansion | `deleteDealAction` best-effort `storage.remove()` then deletes rows regardless — bytes orphan on failure | Verify/retry remove(); reconciliation/GC job; log deletions | Failure-path-only edge case; relational CASCADE is clean |
| File/note data residency not pinned to EU | Chapter V Art 44–49, 28; LGPD Art 33 | Low | On-expansion | Files are the largest PII payload; unpinned Supabase region | Pin Supabase (DB+Storage) to EU region before EU tenant; SCC/DPF remaining sub-processors | Single deploy-config choice; zero present GDPR exposure |

### 4.3 OLX Listing Ingestion (web scraping)

*Largely inapplicable to EU law — Brazilian site, Brazilian sellers, Brazilian users. Live regime LGPD + OLX ToS + Brazilian copyright.*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| Indiscriminate capture of seller PII (name/phone in free-text), no basis/notice | Art 6(1), 14, 5(1)(a)(c); LGPD Art 7/9 | Medium | Conditional | Clearview/CNIL pattern — *if* GDPR applied. Sellers are Brazilian; Art 3(2) triggers do **not** reach seller data — only Art 3(1) establishment would | PII filter at ingestion (strip phones/names); stop storing 2000-char body; LIA + transparency now (LGPD) | Art 6(1)(f) + Art 14(5)(b) disproportionate-effort defence is viable if documented |
| No DPIA / Art 30 record for automated scraping of personal data | Art 35, 30; LGPD Art 38 | Low | On-expansion | "Large-scale" trigger stretched — capped DEFAULT 25 / HARD_MAX 50 per run | Produce LGPD RIPD now (carries to GDPR DPIA); minimisation collapses the trigger | Derivative + threshold-questionable; minimisation removes it |
| Re-serving listing photos/descriptions — copyright reproduction/CTTP | InfoSoc 2001/29 Art 2/3 | Low | On-expansion | EU copyright bites only on a reproduction/communication act in the EU (e.g. OM forwarded to EU recipient) | Keep images as URL references (not rehosted) to preserve framing defence; license on EU expansion | Svensson/BestWater/VG Bild-Kunst: linking freely-available content ≠ new communication. Code already references, never rehosts |
| Free-text body can sweep special-category data | Art 9(1); LGPD Art 11 | Low | Conditional | Speculative — commercial listings rarely contain Art 9 data; associate self-rates low/low | Structured field extraction instead of whole-body dump | Art 9(2)(e) "manifestly made public" available for genuinely public ads |
| Bot-detection circumvention strengthens ToS/unfair-competition claims | OLX ToS; CJEU *Ryanair v PR Aviation* (C-30/14) | Low | Conditional | Predominantly Brazilian contract/tort; **no standalone EU anti-circumvention statute reaches a Cloudflare bot-wall** (InfoSoc Art 6 TPM rules protect works, not access) | Prefer official feeds/API; honour robots.txt/rate limits | Browse-wrap enforceability varies; deliberate evasion removes "inadvertent access" defence |

### 4.4 Location Intelligence & Demographics

*Hard-locked to Brazil. Live regime LGPD. Two items are contractual (not EU statute) and bite regardless of jurisdiction.*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| OSM/Nominatim used without ODbL attribution or contact in User-Agent | ODbL 1.0; OSMF Usage Policy (contractual) | Low | Now (contractual) | This path **fires today** (no key needed); UA `RealTools/1.5` has no contact URL → throttling/block risk | Add "© OpenStreetMap contributors" credit where shown; add contact URL to UA; self-host at volume | Internal analytics use is light; attribution duty strongest on public display |
| Indefinite storage of Google Places content (caching ceiling) | Google Maps Platform Terms (contractual, **not EU statute**) | Low | Now (contractual, latent) | `raw_places`/`raw_geocode` persisted with no TTL; only `place_id` permitted long-term — **but no API key set, so path is dormant** | Before enabling key: keep `raw_places` in-memory; store only `place_id`+derived; ≤30-day refresh | No key in `.env.example` → zero present breach |
| Neighborhood income / consumer-profile inference (socioeconomic proxy) | Art 9(1), 4(1), 22(4); recital 51 | Low | On-expansion | **Income is not an Art 9 category**; "inferred special category" doctrine is *OT v Lietuvos* (C-184/20) case law, not Art 9 text; data is area-level, non-personal within this feature | Keep demographics area-scoped; never render as a trait of a named investor | Crystallises only at the downstream matching join |
| Fabricated mock demographics feed scoring (accuracy / Art 22) | Art 5(1)(d), 22; LGPD Art 6 | Low | On-expansion | **Art 22 not engaged** (human broker in loop; output is a sales suggestion, not an automated decision on the subject). Real concern: data quality | UI label on fabricated data; exclude mock figures from scores driving `recommended_action` | System tags `fallback:true` + low confidence (helps) |
| Nearby-business capture can ingest sole-proprietor PII | Art 6(1), 14 | Low | On-expansion + key | Dormant (no Places key); most results corporate | LI basis + Art 14(5)(b) on expansion; filter individual-name results | Both triggers (EU + key configured) must be true |
| Geocoding scraped residential addresses (cross-feature) | Art 6(1), 14, 4(1) | Low | On-expansion | Address+lat/lng of an identifiable home; CRE focus is commercial (generally not personal data) | Address in listing-import feature; tie lat/lng retention to listing lifecycle | Collection (not geocoding) is the root issue |

### 4.5 Opportunity Scoring Engine

*Scoping correction: the `opportunity_scores` engine (incl. `investor_fit_score`) scores only property price + tags — **no personal data**, so no profiling/Art 22 concerns attach to it. Findings target the separate investor-matching pipeline.*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| Investor-matching is profiling, but human-in-loop keeps it outside Art 22 prohibition | Art 22(1)-(2), 4(4) | Low | On-expansion | `recommended_action` goes to the broker; de-prioritising a B2B lead isn't a "legal/similarly significant effect" (EDPB WP251) | Preserve meaningful human review; add Art 22(3) safeguards only if auto-send is built; LGPD Art 20 now | Not "solely" automated; deterministic rule-based code strengthens the argument |
| No transparency to investor that match scores are computed | Art 13/14, 5(1)(a), 4(4) | Low | On-expansion | Cure is a one-clause notice + Art 6(1)(f) LI basis — paperwork gap | Profiling disclosure in privacy notice; LIA now (LGPD Art 9) | B2B + voluntarily-supplied prefs support LI |
| Match score partly derived from neighborhood income — Art 9 proxy | Art 9, 22(4) | Low | Conditional | `localIntelligenceScore` reads area income off the property, weighted 0.18 of one of seven inputs; "income proxies race" is asserted, not law | Don't render area demographics as a named-investor trait; DPIA if retained | Misattributed recital 51; doubly speculative |
| Scores feed on fabricated demographic data (accuracy / contestability) | Art 5(1)(d), 22(3); LGPD Art 6(V)/20 | Low | Conditional | Mock area figures are non-personal until joined; outputs labelled estimates with confidence | Propagate real-vs-mock provenance flag (data-integrity > legal) | Calibrated estimate ≠ inaccurate personal data |
| DPIA for systematic profiling | Art 35(1), 35(3)(a) | Low | On-expansion | Small B2B CRM weak on "extensive" + "significant effects"; **advisory under Art 35(1), not mandatory under 35(3)(a)** | Dual LGPD RIPD / GDPR DPIA before EU onboarding | Threshold arguable; collapses if minimisation removes PII |

### 4.6 Investor / Client Matching & Profiling

*Internal broker-facing tooling. Live regime LGPD (~80% congruent).*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| **Service-role client bypasses RLS; isolation = app-layer `user_id` only** | Art 5(1)(f), 32, 25; **LGPD Art 46/49** | **High** | **Now** | Every investor/client-opportunity action uses `createSupabaseServiceClient()`; mig 019 disabled RLS on all tables; one missed `.eq('user_id', …)` filter (note `any` casts) leaks financial profiles cross-tenant → reportable breach | **Re-enable RLS with `user_id` policies as defence-in-depth**, or assert tenant-scoping in tests; treat as Art 25 — **do now, regardless of EU** | App-layer scoping is legitimate *if* rigorously tested; gap is the missing DB backstop |
| Automated profiling exists, but Art 22 prohibition likely NOT triggered | Art 22, 4(4), 13(2)(f)/14(2)(g), 15(1)(h), 21 | Medium | On-expansion / LGPD now | Score ranks *listings* for the broker; post-*SCHUFA* (C-634/21) Art 22 read broadly only where score determines outcome | Keep human review genuine; profiling-transparency text + objection path; **LGPD Art 20 (review-on-request) binds now** | Decision-support, not solely-automated decision |
| No lawful basis recorded for profiling investor PII/financial data | Art 6(1), 5(2) | Medium | On-expansion / LGPD now | Basis **exists** (B2B relationship mgmt = LI); defect is undocumented basis + no source field | LIA + per-record basis/source field (administrative) | Recognised LI use; thin line is non-client prospects |
| Free-text notes + neighborhood-income inference can capture/derive Art 9 data | Art 9(1); LGPD Art 11 | Medium | On-expansion / LGPD now | Foreseeable-misuse vector, not intended Art 9 processing; income proxy attenuated (scores a listing, not the investor) | No-sensitive-data policy + optional detection; keep area income property-level | *C-184/20* concerned far more direct inference |
| No transparency / privacy notice to investors (esp. broker-entered prospects) | Art 13, 14; LGPD Art 9 | Medium | On-expansion / LGPD now | Prospect has no other route to learn of processing; Art 14 is the sharper limb | Publish notice; broker-facing template for prospects; Art 14(5)(b) analysis | Art 14(5)(b) needs compensating measures (public notice), not silence |
| No data-subject access path to own profile / match scores / logic | Art 15 (15(1)(h)); LGPD Art 18 | Low | On-expansion | Reactive duty, triggered only on request; rare in B2B CRM | Documented manual DSAR assembly process (no build needed) | Deterministic breakdown makes manual assembly easy; trade-secret carve-out (rec.63) narrow |
| No retention limit / auto-deletion — profiles persist indefinitely | Art 5(1)(e), 17; LGPD Art 15/16 | Low | On-expansion | Storage-limitation rarely enforced standalone; active records legitimately retained | Retention schedule + scheduled deletion; cascade to matches/opportunities | Documented schedule, not zero retention |
| Derived match scores not contestable/correctable; mock-demographics skew | Art 5(1)(d), 16; LGPD Art 18(III) | Low | On-expansion | `scoreBudget`/`localIntelligenceScore` return hardcoded 55 on missing inputs; mock demographics persist | Surface confidence/missing_data; don't persist fabricated values as factual | Calibrated estimate defensible; recompute partly satisfies rectification |
| DPIA for systematic profiling | Art 35(3)(a) → **35(1) advisory** | Low | On-expansion | Not the mandatory 35(3)(a) category (no decision with legal effect on subject); advisory under general test | Dual LGPD/GDPR DPIA before EU data | Rule-based B2B is lower-risk than opaque ML |

### 4.7 OM Email Sending & Open Tracking (pixel + URL token)

*The one feature that can drag GDPR/ePrivacy in accidentally via a forwarded link opened in the EU.*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| Email open-tracking pixel fires with no prior consent | ePrivacy Art 5(3); EDPB Guidelines 2/2023 | Low | On-expansion | Law correct (pixels in scope, no strictly-necessary exemption for analytics) — but bites only if rendered on EU equipment; PT-BR→Brazilian recipients = edge case | **Drop the pixel** (it's secondary/redundant to the URL token) before EU exposure | Removable at near-zero product cost |
| Silent URL-token open-tracking profiles recipient without transparency | Art 13, 5(1)(a); Art 3(2)(b); ePrivacy Art 5(3) (weak) | Low | On-expansion | Single open-timestamp on one's own B2B contact ≠ Art 83(5) "behavioural profiling"; ePrivacy hook for a query-param read is weak | One-line disclosure ("o remetente pode ver quando você abre este documento") + opt-out; LGPD Art 9 now | URL-click = positive action; Art 6(1)(f) (recital 47) cover |
| Marketing email has no unsubscribe / opt-out mechanism | ePrivacy Art 13(2)-(4); Art 21(2)-(3) | Low | On-expansion | **Also a present-day Resend ToS + deliverability issue** independent of EU law | Add unsubscribe link + `List-Unsubscribe` header + suppression flag **now** | Soft opt-in (existing relationship) likely available; only the opt-out is missing |
| No verified lawful basis / opt-in record for OM sends | Art 6(1), 7/rec.47; ePrivacy Art 13(1)-(2) | Low | On-expansion | "No basis" is alarmist — basis almost certainly exists; gap is **evidential** | Capture lawful-basis/consent provenance per investor on expansion | RealTools likely processor; broker is controller of contact list |
| Investor name+email transferred to Resend (US), no transfer safeguards in code | Chapter V Art 44-46, 28 | Low | On-expansion | Today a Brazil→US LGPD Art 33 flow; plain B2B contact data (not Art 9) | Execute Resend DPA; confirm DPF/SCC; pin Supabase EU region | Resend strong DPF/SCC candidate — paperwork, not re-architecture |
| Forwardable public OM link makes EU monitoring trigger materialise | Art 3(2)(b); ePrivacy Art 5(3) | Low | Conditional | One incidental EU open is a thin, contested basis for Art 3(2)(b) (recital 24; EDPB Guidelines 3/2018 require purpose/intent to monitor) | Removing the pixel + adding disclosure neutralises most of this | Incidental, non-targeted monitoring defensible for a Brazil-first tool |

### 4.8 AI Deal Summary Generation

*Rendered only on authenticated broker routes — NOT on public OM pages. `investorName` nulled before the payload leaves the platform (good minimisation).*

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| Prompt sent to US LLM with no verified no-training / processor contract | Art 28; **LGPD Art 39/33**; provider ToS | Medium | **Now** (LGPD governance) | Consumer `generativelanguage.googleapis.com` endpoint, no DPA/no-training term; free tier may train. **Binding law today is LGPD, not Art 28** | Move to **paid Gemini tier** (or Vertex) with no-training/retention terms; pin OpenRouter models that disable training; ROPA entry | No-training divide is **free vs paid**, not "consumer vs Vertex"; payload minimised |
| Cross-border transfer of limited PII in prompt to US providers | Chapter V Art 44-46; LGPD Art 33 | Low | On-expansion | Payload minimised (investorName nulled, no contact data, raw prompt not persisted); area aggregates arguably non-personal | ROPA entry; DPF/SCC on expansion; coarsen `nearbyBusinesses[].name` to category-only | Only clear third-party PII left is scraped business names |
| Accuracy of AI claims about property/areas | Art 5(1)(d), 16; otherwise civil liability | Low | On-expansion | GDPR hook thin — judgments concern a property/area, not a named person; UCPD N/A (B2B) | Keep confidence indicator + "state uncertainty" prompt; UI disclaimer | Advisory framing; broker is professional intermediary |
| Special-category by inference (area socioeconomic profile) via LLM | Art 9; LGPD Art 11 | Low | Conditional | Collapses at LLM boundary — investorName nulled, so demographics aren't joined to an identified person | Keep demographics area-level; document in DPIA on expansion | Art 9 can't attach to anonymous area statistics |

### 4.9 Cross-cutting: Data Transfers, Residency & Sub-processors

| Title | Regulation | Severity | Trigger | Exposure | Recommendation | Leeway |
|-------|-----------|----------|---------|----------|----------------|--------|
| **Latent/undisclosed sub-processor: code defaults to OpenRouter** | Art 28(2)/(4), 30; **LGPD Art 39** | Medium | **Now** (config drift) | `getDealSummaryProviderConfig()` defaults provider `openrouter` / model `google/gemini-flash-1.5` (deal-summary-provider.ts:35-36) while `.env.example` says `gemini` — production may use an undocumented US router fanning out to upstream hosts | **Pin `AI_DEAL_SUMMARY_PROVIDER` explicitly in every env; reconcile default with `.env.example`;** name whichever ships in the ROPA | Setting provider=gemini eliminates the OpenRouter hop — clean config fix |
| No sub-processor inventory / Records of Processing (Art 30) | Art 30; **LGPD Art 37** | Medium | **Now** (LGPD) | No RoPA/SUBPROCESSORS doc; chain only reconstructable from code (Supabase, Clerk, Resend, Google, Gemini, OpenRouter, Nominatim, +Vercel) | Author one SUBPROCESSORS.md / RoPA now (doubles as LGPD Art 37 record): region, data categories, purpose, transfer basis per processor | Art 30(5) exemption unavailable (regular processing); lightweight tabular form acceptable |
| AI prompt ships address + income/demographic inferences to US LLM, no no-training/retention terms recorded | Art 28(3)(a), Chapter V; AI Act Art 50 | Medium | **Now** (LGPD) / on-expansion | Live LGPD Art 33 + Art 6 purpose-limitation gap; documentary not substantive (paid Gemini API already excludes training) | Record vendor no-training commitment; coarsen/drop address+income before prompt | Art 9 "income proxies sensitive traits" limb speculative — don't treat as established |
| Supabase region not pinned — primary EU residency decision left to default | Chapter V Art 44-46, 25; LGPD Art 33 | Medium | On-expansion | All PII in Supabase. **Note: `config.toml` `tenant_region='us'` is the *local CLI* setting, not the hosted project region** (a dashboard choice at creation) | Provision EU-tenant in a Supabase EU region before EU onboarding; document in RoPA | No present obligation (Brazil→US lawful under LGPD Art 33); cheap pre-commitment |
| No Chapter V transfer mechanism (SCCs/DPF) for US chain | Art 44-46; EU-US DPF (Impl. Dec. 2023/1795) | Medium | On-expansion | Each US flow unlawful *until papered* — but contingent on (a) GDPR triggering AND (b) vendor not DPF-covered | RoPA transfer-basis column: DPF cert link or executed SCCs; pre-verify DPF status now (free) | Google/Resend/Clerk DPF-self-certifiable → Art 45 adequacy, no SCCs for certified entities |
| No Art 28 DPAs evidenced with any sub-processor | Art 28(3); LGPD Art 39 | Medium | On-expansion | Standalone infringement for both parties (Art 83(4)); blocks lawful sub-processor use | Accept each vendor's standard (click-through) DPA; author one broker-facing DPA exhibit | *Verdict: unverified.* Downstream side satisfiable by acceptance, not negotiation |
| Service-role client broadens transfer/aggregation surface (cross-tenant payloads) | Art 28(3), 25; LGPD Art 46/47 | Low | Conditional | Materialises only IF an app-layer filter is missed; fundamentally a security/minimisation issue | Assert tenant scope immediately before any outbound fetch; unit-test payloads | GDPR mandates effective access control, not RLS specifically |
| Nominatim/OSM — usage-policy (ToS) obligation, not transfer | OSMF Nominatim Usage Policy | Low | Conditional | EU-hosted → no Chapter V transfer; residual is ToS/rate-limit + thin PII if seller strings geocoded | Keep descriptive UA; honour 1 req/s; strip names/phones before geocoding | Address geocoding widely treated as non-personal |
| No sub-processor change notification / objection right for brokers | Art 28(2) | Low | On-expansion | Doubly contingent: needs GDPR triggered AND a general-authorisation DPA (neither exists; zero EU tenants) | Versioned sub-processor page + subscribe, OR specific authorisation in DPA | Specific authorisation removes need for notice mechanism at low tenant count |

---

## 5. Cross-cutting & systemic gaps (governance scaffolding)

The per-feature work is thorough on transfers, transparency and profiling but misses the **governance spine** that turns scattered findings into a compliance program. The following are *additions* surfaced by the completeness review:

- **Controller vs processor topology is unresolved (Art 26 / 4(7)-(8)).** RealTools is the broker's **processor** for broker-uploaded files/contacts, but a **controller in its own right** for its derived scoring, demographic inference, matching, and open-tracking analytics. This dual-hat determines *who owes the Art 13/14 notice to investors* — currently ownerless. **Resolve this first; it is foundational, not a detail.**
- **GDPR Art 27 (EU representative).** On any Art 3(2) trigger, a controller with no EU establishment must appoint a written EU representative — a standalone obligation distinct from the Art 30 record. Unmentioned in per-feature findings.
- **GDPR Art 33/34 (breach notification).** No finding raises 72-hour notification readiness or an incident process — yet the RLS-disabled, service-role, forwardable-token architecture is precisely what produces reportable breaches. LGPD Art 48 imposes an analogous duty **now**.
- **GDPR Art 37-39 (DPO).** Systematic profiling + large-scale scraping may trip Art 37(1)(b)/(c) mandatory DPO designation (and an LGPD **encarregado** is expected now). Not assessed.
- **Consolidated DPIA (Art 35(1)).** The architecture is one linked high-risk chain: scrape → infer demographics → profile/score investors → track opens. Art 35(1) wants **one** assessment of that set, not five scattered "DPIA likely" notes.
- **Lawful-basis register / RoPA (Art 5(2), 24).** Needed across *all* subjects (brokers, investors, buyers, scraped third parties) as the accountability spine — currently raised piecemeal.
- **No consent-capture infrastructure (Art 7(1)/7(3)).** Even if a future EU basis needs consent (tracking/marketing), there is no machinery to record or allow withdrawal of it.
- **Vercel as host/sub-processor.** US-hosted server/request/error logs routinely capture PII (emails, tokens, addresses) and appear in no sub-processor inventory or Chapter V map. Add to the RoPA.
- **Backups, replicas & observability logs.** Erasure findings address live rows/storage only — Art 17 is incomplete if PII persists in Supabase backups with no defined cycle.
- **Broker activity / import-run / audit tables.** The broker is the implicit subject of all activity logs (employee-monitoring-adjacent); no lawful-basis/retention/access analysis exists.
- **AI Act Annex III §5(b)/(c) watch-item.** The financial-robustness/risk classification of investors is *adjacent* to creditworthiness scoring. Keep as a watch-item (not a flat clearance), and remember **Art 50 still bites on the LLM summaries** regardless of the rule-based scorer.
- **Art 49 derogations** as a fallback transfer route, and **ePrivacy Art 5(3) on the public OM page render itself**, deserve a line in the transfer/cookie analysis.

---

## 6. Prioritized remediation roadmap

### Now (regardless of EU — LGPD duties + live security/governance)

1. **Re-enable Supabase RLS with `user_id` policies** as defence-in-depth (or, minimum, automated tests asserting every service-role query is tenant-scoped). *The one genuine architecture-level risk.* (Art 25/32; LGPD Art 46/49)
2. **Pin `AI_DEAL_SUMMARY_PROVIDER` explicitly in every environment** and reconcile the code default with `.env.example`. Eliminate the undocumented OpenRouter hop or document it. (LGPD Art 39)
3. **Publish one consolidated PT-BR privacy notice** (LGPD-structured, ~80% GDPR-ready): controller identity, purposes, legal bases, sub-processors (Supabase, Clerk, Resend, Google, Gemini/OpenRouter, Vercel), retention, rights. Link in global footer + OM footers + signup. (LGPD Art 9)
4. **Author a SUBPROCESSORS.md / RoPA** (doubles as LGPD Art 37 record) — one row per processor: region, data categories, purpose, transfer basis. Include Vercel and backups. (LGPD Art 37)
5. **Confirm the AI vendor no-training/retention posture** (move to a paid Gemini tier) and record it. (LGPD Art 39/33)
6. **Add unsubscribe link + `List-Unsubscribe` header + suppression flag** to OM emails (also Resend ToS + deliverability).
7. **Resolve the controller/processor topology** and assign ownership of the investor-facing transparency duty.
8. **Document a manual DSAR/erasure process** and an incident/breach-notification runbook (LGPD Art 48). Define a retention schedule for notes/files/investors.
9. **Delete the orphaned Supabase `exchangeCodeForSession` callback route**; make storage deletion reliable (verify `remove()`, add GC/reconciliation job).

### Before EU launch (on Art 3 trigger becoming realistic)

1. **Pin Supabase (DB + Storage) to an EU region** (Frankfurt) — project-creation-time choice, painful later; the single highest-leverage transfer mitigation.
2. **Execute standard DPAs** (Clerk, Supabase, Resend, Google, OpenRouter if used) and a **broker-facing DPA** with sub-processor flow-down. (Art 28)
3. **Verify EU–US DPF certifications** for Clerk/Google/Resend; fall back to SCCs where uncovered; record transfer basis per processor + a transfer-impact assessment. (Art 45/46)
4. **Appoint an Art 27 EU representative** and assess **Art 37 DPO** designation. Stand up formal **Art 30 records**.
5. **Conduct one consolidated DPIA** over the scrape→infer→profile→track chain. (Art 35(1))
6. **Drop the OM tracking pixel** (redundant) and add open-tracking disclosure + opt-out; gate any residual tracking behind consent for EU recipients. (ePrivacy Art 5(3)/13)
7. **Implement the Clerk `user.deleted` erasure cascade** and self-service delete; extend erasure to backups.
8. **Add profiling-transparency text** + objection path for investors; ensure DSAR tooling can return `investor_listing_matches`.
9. **Add a privacy-URL + consent config** at signup (Clerk dashboard).

### Nice-to-have / watch-items

- Strip PII (phone/name) from scraped `description`/`raw_payload` at ingestion; switch to structured field extraction. (Also reduces any future Art 35 trigger.)
- Add ODbL "© OpenStreetMap contributors" attribution + contact URL in the Nominatim User-Agent.
- Before enabling a Google Maps key: stop persisting `raw_places`/full `raw_geocode`; store `place_id` + derived only; ≤30-day refresh.
- Propagate a real-vs-mock provenance flag on fabricated demographics; UI-label estimates.
- Use opaque object IDs (not PII-bearing filenames) in storage keys; confirm `om-images` excludes documents.
- Keep scraped images as URL references (never rehost) to preserve the framing/linking defence.
- AI Act Annex III creditworthiness-adjacency watch-item for the investor risk classification.

---

## 7. Appendix: Dropped or overstated findings (verifier rejected)

### 7.1 Not-applicable / cleared (corrected severity: none)

These were assessed and found **out of scope** — recorded so the analysis is auditable and not re-litigated.

| Finding | Regulation | Verdict | Why excluded |
|---------|-----------|---------|--------------|
| EU Database sui generis right & ePrivacy don't apply (Location Intelligence) | Dir 96/9; ePrivacy Art 5(3); AI Act Art 50 | not-applicable | Only IBGE/SIDRA (Brazilian public) + OSM (ODbL) sources — no EU-maker DB; no cookies/terminal identifiers; `deriveConsumerProfile` is deterministic, not generative AI |
| Scoring/matching engine outside AI Act (Opportunity Scoring) | AI Act Art 3(1), rec.12, Annex III, Art 50 | confirmed → none | Fully deterministic (fixed weights, if/else); rec.12 carve-out applies; lead-prioritisation not Annex III; scores broker-internal |
| AI Act minimal grip on matching engine (Investor Matching) | AI Act Art 50 | confirmed → none | Hand-written weighted scoring, not ML; not Annex III; Art 50 attaches to the LLM summary feature only, on EU placement |
| Art 22 automated decision-making (AI Summary) | Art 22 | not-applicable | Advisory text consumed by a human broker; no solely-automated decision with legal effect on a subject |
| DSA intermediary/hosting liability (AI Summary) | DSA Reg 2022/2065 | not-applicable | First-party internal decision-support, not hosted user content; not on public pages |
| DSA hosting on public OM pages (Consent/Cookies) | DSA Art 6, 16, 19 | not-applicable | RealTools is the content provider (scrapes + republishes its own curated content over private per-recipient links) — not an intermediary storing recipients' uploads; not "dissemination to the public". *(Also: the finding's Art 19 claim was wrong — that exemption covers Section 3 platform duties, not Art 16.)* |
| No consumer terms / consumer-law surface (Consent/Cookies) | CRD 2011/83; UCPD 2005/29 | not-applicable | Sold B2B to brokers; OM pages non-transactional (no checkout/contract). Maintain B2B SaaS terms instead. Watch only if a B2C transactional surface is added |

### 7.2 Materially overstated (downgraded by verifier)

The associate's original severities ran hot. The most consequential corrections (mostly: "GDPR scored as a present-day high when it does not apply today, and a usable legal basis already exists"):

| Finding | Original | Corrected | Reason for downgrade |
|---------|----------|-----------|----------------------|
| OLX seller-PII capture | high | medium | Brazilian sellers; Art 3(2) triggers don't reach seller data — only Art 3(1) establishment would. Art 6(1)(f)+Art 14(5)(b) defence viable |
| Uploaded files Art 14 (Deal Mgmt) | high | low | **Art 14 is a controller duty (the broker's), not a processor duty** — RealTools has no Art 14 obligation; handled by the DPA |
| Notes/files retention; no-DPA; free-text notes (Deal Mgmt) | high | medium | GDPR N/A today; viable bases/retention exist — LGPD documentation gaps, not unlawful processing |
| Neighborhood-income → race/ethnicity Art 9 (Location Intelligence & Opportunity Scoring) | high | low | Income isn't an Art 9 category; area-level non-personal; "proxy" chain is inferential, recital 51 misattributed |
| Mock-demographics → Art 22 (Location Intelligence) | medium | low | Art 22 needs a solely-automated decision with significant effect on the subject — human broker in loop; output is a sales suggestion |
| Investor lawful-basis / Art 9 notes / RLS-as-transfer (Investor Matching) | high (×2) / medium | medium / low | Basis exists (LI); notes are foreseeable-misuse; RLS issue is security (kept high separately), not a transfer-paper issue |
| OM pixel / silent tracking / forwardable link (OM feature) | high (×3) | low | Bites only on EU terminal equipment (edge case for PT-BR→Brazil); single open-timestamp ≠ Art 83(5) profiling; Art 3(2)(b) needs intent to monitor |
| Clerk/Supabase transfer & Art 28 (Auth) | high (×2) | medium / low | No GDPR controller relationship today; DPF candidates; click-through SCC-DPAs |
| AI prompt no-DPA "trigger: now" for Art 28 (AI Summary) | high | medium | Binding law today is LGPD Art 39, not GDPR Art 28; payload minimised (investorName nulled) |
| Supabase region / Chapter V / Art 30 (Cross-cutting) | high (×2) / medium | medium | No present GDPR exposure (Brazil→US under LGPD Art 33); DPF + EU-region pinning are cheap conditional fixes |
| AI Act / InfoSoc copyright (OLX) | medium | low / N-A note | Territorial — Brazilian LDA applies, not InfoSoc; framing/linking defence already preserved in code |

**One finding remains UNVERIFIED:** "No Art 28 DPAs evidenced with any sub-processor" (Cross-cutting) carries a `unverified` verdict with no correction note — treat its corrected medium severity as provisional pending confirmation.

---

## 8. Brazil — the binding-now regime (LGPD + sector law)

> RealTools is a Brazil-first B2B CRE tool. **Brazilian law binds today**; the EU sections above are conditional on expansion. This section is the live compliance picture.

### 8.1 LGPD (Lei 13.709/2018) — in force since 2020, ANPD-enforced since 2021

The "Now" roadmap in §6 *is* the LGPD compliance list — same fixes, Brazilian framing:

| GDPR concept (above) | LGPD equivalent | Status in code |
|----------------------|-----------------|----------------|
| Privacy notice (Art 13/14) | **Aviso de Privacidade** (Art 9) | ❌ none in product (brokers, investors, buyers, scraped third parties) |
| Lawful basis (Art 6) | **Base legal** (Art 7 — 10 bases) | ⚠️ legitimate-interest basis exists but undocumented |
| Sensitive data (Art 9) | **Dado pessoal sensível** (Art 11) | ⚠️ free-text notes (`z.string().min(1)`) can sweep it |
| DPO (Art 37) | **Encarregado** (Art 41) | ❌ no named contact / channel |
| Breach notify (Art 33/34) | **Comunicação à ANPD + titular** (Art 48) | ❌ no runbook |
| Intl transfer (Ch V) | **Transferência internacional** (Art 33) | ❌ Supabase / Clerk / Resend / OpenRouter-Gemini (all US) unpapered |
| Data-subject rights (Art 15–22) | **Direitos do titular** (Art 18 — 9 rights) | ❌ no DSAR path; profile page read-only |
| Records of processing (Art 30) | **Registro das operações** (Art 37) | ❌ processor chain only discoverable by reading code |

**Enforcement teeth:** ANPD may impose fines up to **2% of the entity's Brazil revenue, capped at R$50M per infraction**, plus daily fines, publicization, and data blocking/deletion. This is live exposure — not conditional on EU expansion.

**Art 33 transfers sharpened:** ANPD's **Resolução CD/ANPD nº 19/2024** issued the *cláusulas-padrão contratuais* (Brazil's SCC equivalent). Each US sub-processor hop now needs a documented transfer basis (standard clauses, adequacy, or specific consent).

**Encarregado note:** under **Resolução CD/ANPD nº 2/2022**, small-scale processing agents get simplified obligations, but a published Encarregado contact channel is still expected.

### 8.2 Brazil-specific laws the EU analysis did not cover

| # | Law | What it requires | RealTools exposure |
|---|-----|------------------|--------------------|
| 1 | **Marco Civil da Internet** (Lei 12.965/2014) | Art 15: *provedor de aplicação* must **retain application access logs for 6 months**. Art 19: third-party-content liability only after judicial order. | **Now.** No defined log-retention exists. This is a *keep*-duty (tension with LGPD minimization, resolved by the legal mandate). Art 19 gives safe-harbor for scraped/republished listing content until a court order. |
| 2 | **CRECI / COFECI** (Lei 6.530/1978; Dec. 81.871/1978) | Only CRECI-registered *corretores* may intermediate real estate. Property valuation (PTAM / NBR 14653) is reserved to CRECI/CREA. | **Likely clear** — RealTools is a tool for brokers, not itself intermediating. **Critical framing rule:** the opportunity score must never read as **"avaliação imobiliária"** (regulated). `CLAUDE.md` already mandates "atratividade"/"fit score", never "avaliação" — keep that discipline; it is the line between SaaS and unlicensed valuation. |
| 3 | **AML — Lavagem de dinheiro** (Lei 9.613/1998 + COAF) | Real-estate transactions are an obligated sector; suspicious transactions must be reported to **COAF**. | **The broker is the obligated entity, not the SaaS.** Watch only if RealTools begins facilitating closings or payments. |
| 4 | **OLX scraping** | LGPD (third-party seller PII, no consent/notice) + concorrência desleal + OLX ToS + Lei de Direitos Autorais (Lei 9.610/1998). | **Now**, under Brazilian law (cf. EU §4.3, which was conditional). Mitigations: strip seller PII at ingestion; keep images as URL references; preserve framing/linking defence. |
| 5 | **CDC** (Lei 8.078/1990) | Consumer-protection duties on B2C surfaces. | B2B SaaS → **mostly out**. Bites only if a consumer-facing transactional surface is added. |

### 8.3 Brazil "Now" priorities (supersedes nothing in §6 — adds to it)

1. Publish a consolidated **PT-BR Aviso de Privacidade** (LGPD Art 9) — controller, purposes, legal bases, sub-processors, retention, titular rights. Footer + OM footers + signup.
2. Name an **Encarregado** (Art 41) and publish the contact channel.
3. Paper the **Art 33 international transfers** with ANPD cláusulas-padrão (Res. 19/2024) for Supabase/Clerk/Resend/LLM vendor.
4. Implement **Marco Civil 6-month application-log retention** (and reconcile with the LGPD retention schedule).
5. Stand up the **Art 48 breach-notification runbook** (ANPD + titular) and a manual **Art 18 DSAR/erasure** process.
6. Author the **Art 37 registro das operações** (doubles as the SUBPROCESSORS.md/RoPA from §6).
7. Keep the **"avaliação"-avoidance framing** enforced across UI/score copy (CRECI line).

---

*Prepared as an internal risk-scoping artifact. Engage qualified EU and Brazilian (LGPD) counsel before relying on any conclusion herein.*
