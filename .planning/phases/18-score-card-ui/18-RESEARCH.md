# Phase 18: Score Card UI - Research

**Researched:** 2026-05-10
**Domain:** Next.js App Router client/server UI integration for opportunity scoring
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The score card should use a **compact scan first** layout. The broker should immediately see total score, selected strategy, fit label, top positives, top risks, and the category breakdown without scrolling through a long explanation-first panel.
- **D-02:** The total score should be visually prioritized as a **large numeric score inside a thin circular ring**, matching the DMDI-style circular reference language while staying usable in the dark dashboard UI.
- **D-03:** The card should show **five slim category bars always visible** for the scoring categories: demographics, location quality, foot traffic potential, competition, and risk. Do not hide the breakdown behind a details toggle in the first implementation.
- **D-04:** Positive signals and risk flags should render as **two side-by-side lists** in the compact card: `Pontos fortes` and `Riscos`, capped at 3 items each. On narrow mobile widths these can stack vertically, but the semantic split should remain.
- **D-05:** Missing `location_insights` is an explicit empty state, not an error and not a blank region. The UI copy must include: `Enriqueça a localização antes de calcular a pontuação`.
- **D-06:** Score framing must use opportunity/fit language such as `pontuação de oportunidade`, `atratividade`, or `fit`. Do not label it as `avaliação`, because formal property valuation is regulated in Brazil.
- **D-07:** Saved score history is not a time series. One current row exists per `(user_id, listing_id, strategy_slug)`, and `score_version` communicates recompute count.

### the agent's Discretion
- Exact spacing, typography scale, and responsive breakpoints within the current dark, sharp RealTools UI system.
- Exact copy for secondary labels, as long as required Portuguese strings and score framing constraints are preserved.
- Whether the circular score ring is implemented with CSS conic gradients or SVG, as long as it is accessible and does not introduce a chart dependency for this simple visual.

### Deferred Ideas (OUT OF SCOPE)
- Full expand/collapse detail mode for every category signal and risk — not required for Phase 18 first implementation.
- Score comparison across listings — future requirement SCO-21 / SCO-F2.
- Score trend chart across historical versions — future requirement SCO-F1, blocked by current non-time-series history model.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCO-13 | Broker can select a strategy from a strategy selector on `/imoveis/[id]` and trigger scoring with one action. | Use `STRATEGY_SLUGS`/`STRATEGIES` for options and call `scoreListingAction(listingId, strategySlug)` from a client component. [VERIFIED: `.planning/REQUIREMENTS.md`; `lib/scoring/strategies.ts:4`; `lib/actions/scoring-actions.ts:12`] |
| SCO-14 | Score card displays total score, color band, strategy label, fit label, bars, top positives, and top risks. | Use `ScoreResult` fields `totalScore`, `strategySlug`, `fitLabel`, `breakdown`, `signals`, and `risks`; render five UI-spec bars only. [VERIFIED: `.planning/REQUIREMENTS.md`; `lib/scoring/schemas.ts:26`; `.planning/phases/18-score-card-ui/18-UI-SPEC.md`] |
| SCO-15 | Missing `location_insights` shows enrich prompt instead of a score. | Listing page already loads `locationInsight`; branch the score section when this value is null. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:37`; `app/(app)/imoveis/[id]/page.tsx:141`] |
| SCO-16 | No saved score for selected strategy shows compute CTA. | Page must load current `opportunity_scores` rows and client component must map selected strategy to a saved row or empty CTA. [VERIFIED: `lib/scoring/data.ts:63`; `.planning/phases/18-score-card-ui/18-UI-SPEC.md`] |
</phase_requirements>

## Summary

Phase 18 should be planned as a narrow UI integration phase: server page loads listing, `locationInsight`, and saved score rows; a client score section owns selected strategy state, pending state, action messages, and immediate score rendering after `scoreListingAction`. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:20`; `components/listings/location-insight-action.tsx:14`; `lib/actions/scoring-actions.ts:12`]

The main implementation gap is not the scoring action. It is converting saved `opportunity_scores` rows into UI-ready score card props with `score_version` metadata. The existing `ScoreResult` type has no `scoreVersion` field, while saved rows carry `score_version` plus JSON `breakdown/signals/risks`. Plan a local UI adapter type such as `{ result: ScoreResult; scoreVersion?: number }` rather than changing engine schemas. [VERIFIED: `lib/scoring/schemas.ts:26`; `types/supabase.ts`; `lib/scoring/data.ts:63`]

**Primary recommendation:** Build one client `OpportunityScoreCard` that includes the selector, CTA, empty states, ring, bars, signals, risks, and action handling; keep `StrategySelector` as a small controlled subcomponent, and add a server-side saved-score load in `app/(app)/imoveis/[id]/page.tsx`. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`; `components/listings/location-insight-action.tsx:21`]

## Project Constraints (from AGENTS.md)

- `AGENTS.md` in this repo only embeds RealTools memory context and `/graphify` trigger instructions; it does not define app coding conventions beyond the planning context. [VERIFIED: `AGENTS.md`]
- Project memory says RealTools uses the Node built-in test runner for matching/scoring tests. [VERIFIED: `AGENTS.md`; `package.json`]
- Project memory says generated Supabase types may lag migrations and `as any` casts are an accepted temporary pattern. [VERIFIED: `AGENTS.md`; `app/(app)/imoveis/[id]/page.tsx:30`]
- Project memory says score framing must avoid formal `avaliação` language. [VERIFIED: `AGENTS.md`; `.planning/STATE.md`]
- The project config has `nyquist_validation: true`, so the planner must include validation architecture. [VERIFIED: `.planning/config.json`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Load listing, location insight, and saved scores | Frontend Server (SSR) | Database / Storage | The App Router page already authenticates with Supabase and loads listing/location data before render. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:26`] |
| Strategy selection and pending UI | Browser / Client | Frontend Server (Server Actions) | Select state and pending indicators are interactive client behavior; scoring mutation calls a server action. [VERIFIED: React docs; Next docs; `components/listings/location-insight-action.tsx:18`] |
| Score computation and persistence | API / Backend | Database / Storage | Phase 18 must reuse `scoreListingAction`; engine/service logic is already behind the action. [VERIFIED: `lib/actions/scoring-actions.ts:25`; `.planning/phases/18-score-card-ui/18-CONTEXT.md`] |
| Score card rendering | Browser / Client | Frontend Server (initial props) | The card updates after strategy changes and action results, but receives initial saved scores from the server page. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`] |
| Missing enrichment state | Browser / Client | Frontend Server | Page knows whether `locationInsight` is null; client card should prevent score calls and point to the existing enrichment action. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:141`] |

## Standard Stack

### Core

| Library | Project Version | Registry Latest Checked | Purpose | Why Standard |
|---------|-----------------|-------------------------|---------|--------------|
| Next.js | 15.5.15 | 16.2.6, modified 2026-05-09 | App Router server page, server actions, revalidation | Existing app framework; no upgrade in Phase 18. [VERIFIED: `package.json`; npm registry] |
| React | 19.1.0 | 19.2.6, modified 2026-05-08 | Client component state and `useTransition` | Existing app runtime; React docs support transition pending UI for async actions. [VERIFIED: `package.json`; npm registry; React docs] |
| shadcn/Radix Select | `@radix-ui/react-select` 2.2.6 | 2.2.6, modified 2025-12-24 | Strategy dropdown primitive | Existing `components/ui/select.tsx` wraps Radix Select; Radix supports controlled value and keyboard navigation. [VERIFIED: `components/ui/select.tsx`; npm registry; Radix docs] |
| lucide-react | 1.11.0 | 1.14.0, modified 2026-04-29 | Loading and action icons | Existing project icon library; use `Loader2` pattern already present. [VERIFIED: `package.json`; npm registry; `components/listings/location-insight-action.tsx:4`] |

### Supporting

| Library | Project Version | Purpose | When to Use |
|---------|-----------------|---------|-------------|
| Playwright | 1.59.1 | Browser E2E/smoke validation | Use for Phase 18 workflow verification because ROADMAP explicitly requires E2E coverage. [VERIFIED: `package.json`; npm registry; Next Playwright docs] |
| Node test runner | Node v25.9.0 local | Existing unit/integration tests | Keep existing `npm test` for scoring backend regression after UI integration. [VERIFIED: `node --version`; `package.json`] |
| TypeScript | 5.9.3 local | Compile/type safety | Run `npx tsc --noEmit` or `npm run build` during phase gate. [VERIFIED: `npx tsc --version`; `tsconfig.json`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS conic gradient ring | SVG ring | Both satisfy UI spec; CSS is less markup, SVG can provide cleaner stroke math. Do not add Recharts for this simple ring. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`] |
| One combined client score section | Separate selector and card with duplicated action wiring | Combined owner avoids state duplication; `StrategySelector` can stay presentational/controlled. [VERIFIED: local component patterns] |
| Fetch score rows through API from client | Load saved rows in server page | SSR load matches existing listing page pattern and avoids extra client fetch/auth states. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:26`] |

**Installation:** No new runtime dependency is recommended. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]

## Architecture Patterns

### System Architecture Diagram

```text
Broker opens /imoveis/[id]
  -> Server page authenticates with getUser()
  -> Load listing by user_id + listing_id
  -> Load locationInsight
  -> Load saved opportunity score rows for listing
  -> Render location section
  -> Render score section
       ├─ locationInsight null
       │    -> show "Enriqueça a localização antes de calcular a pontuação"
       │    -> point to existing LocationInsightAction
       └─ locationInsight present
            -> client state selectedStrategy
            -> saved row exists?
                 ├─ yes -> render ScoreResult adapter + Versão {score_version}
                 └─ no  -> render Calcular pontuação CTA
            -> click CTA / change strategy action path
                 -> scoreListingAction(listingId, selectedStrategy)
                 -> action returns ScoringActionState { score?, errors?, message? }
                 -> update local current score when score exists
                 -> router.refresh() to sync server rows
```

### Recommended Project Structure

```text
app/(app)/imoveis/[id]/page.tsx
  # Load saved scores and pass them below location insight.
components/listings/
  strategy-selector.tsx
    # Controlled Select wrapper over STRATEGIES/STRATEGY_SLUGS.
  opportunity-score-card.tsx
    # Client score section, empty states, action handling, ring, bars, lists.
tests/
  score-card-ui.test.mjs
    # Server-render smoke/unit-style HTML or pure helper tests if no React test setup is added.
  score-card.e2e.spec.ts
    # Playwright E2E if planner chooses to add Playwright test config.
```

### Pattern 1: Server Page Loads Initial Data

**What:** Extend `ImovelDetailPage` to call `getScoreHistory(supabase, user.id, id)` after `locationInsight` load, then pass rows to the score UI. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:37`; `lib/scoring/data.ts:63`]

**When to use:** Required for SCO-16 so selected strategies can show existing scores without an extra browser fetch. [VERIFIED: `.planning/REQUIREMENTS.md`]

**Example:**

```tsx
// Source: app/(app)/imoveis/[id]/page.tsx and lib/scoring/data.ts
const locationInsight = await getListingLocationInsightByListingId(supabase, user.id, id)
const scoreRows = await getScoreHistory(supabase, user.id, id)
```

### Pattern 2: Client Action with useTransition

**What:** Mirror `LocationInsightAction`: use `useTransition`, call the server action inside the transition, show `Loader2`, store message/error, and call `router.refresh()` after success. [VERIFIED: `components/listings/location-insight-action.tsx:18`; React docs]

**When to use:** Use for `Calcular pontuação` and `Recalcular pontuação`. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]

**Example:**

```tsx
// Source: components/listings/location-insight-action.tsx + lib/actions/scoring-actions.ts
startTransition(async () => {
  const result = await scoreListingAction(listingId, selectedStrategy)
  if (result.score) setCurrentScore(result.score)
  if (!result.errors) router.refresh()
})
```

### Pattern 3: Saved Row Adapter

**What:** Convert `opportunity_scores` rows into a UI type with the engine result fields plus `score_version`. [VERIFIED: `lib/scoring/data.ts:36`; `types/supabase.ts`; `lib/scoring/schemas.ts:26`]

**When to use:** Required before rendering saved scores because persisted row naming is snake_case while `ScoreResult` is camelCase. [VERIFIED: `lib/scoring/data.ts:30`]

**Example:**

```ts
// Source: lib/scoring/schemas.ts and types/supabase.ts
type ScoreCardEntry = {
  result: ScoreResult
  scoreVersion?: number
}
```

### Pattern 4: Fixed Five-Bar Category View

**What:** Render only `demographics`, `locationQuality`, `nearbyBusinesses`, `competition`, and `risk` in the UI spec order; omit `investorFit` from default bars even when present in engine payload. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`; `lib/scoring/strategies.ts:39`]

**When to use:** Always in the compact score card. [VERIFIED: `.planning/phases/18-score-card-ui/18-CONTEXT.md`]

### Anti-Patterns to Avoid

- **Duplicating strategy labels in JSX:** Use `STRATEGIES` and `STRATEGY_SLUGS` as source of truth. [VERIFIED: `lib/scoring/strategies.ts:4`]
- **Showing fake neutral score defaults:** No saved score must show CTA, not dummy bars. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]
- **Calling scoring when enrichment is missing:** Missing `locationInsight` is an empty state and should not trigger scoring. [VERIFIED: `.planning/phases/18-score-card-ui/18-CONTEXT.md`; `lib/scoring/service.ts`]
- **Adding chart dependency for ring:** UI spec explicitly forbids a chart dependency for the circular score ring. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]
- **Rendering a sixth `investorFit` bar:** UI spec says five bars in first implementation. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Strategy select accessibility | Custom div dropdown | Existing shadcn/Radix `Select` | Radix Select manages focus and keyboard navigation. [CITED: https://www.radix-ui.com/primitives/docs/components/select] |
| Server mutation contract | New API fetch wrapper | Existing `scoreListingAction` | It already authenticates, validates strategy, revalidates path/tag, and returns `ScoringActionState`. [VERIFIED: `lib/actions/scoring-actions.ts:12`] |
| Score computation | New client scoring logic | Existing scoring service/action | Phase 18 is UI-only; engine formulas are out of scope. [VERIFIED: `.planning/phases/18-score-card-ui/18-CONTEXT.md`] |
| Loading state | Custom global state library | `useTransition` + local state | Existing project pattern and React official pending-state hook. [VERIFIED: `components/listings/location-insight-action.tsx:18`; CITED: https://react.dev/reference/react/useTransition] |
| Visual score ring | Recharts/custom chart package | CSS conic gradient or SVG | UI spec explicitly allows these and forbids chart dependency. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`] |

**Key insight:** The hard part is state synchronization between saved rows, selected strategy, and immediate action result, not scoring math. Keep scoring and persistence on the existing server action path. [VERIFIED: `lib/actions/scoring-actions.ts`; `lib/scoring/data.ts`]

## Common Pitfalls

### Pitfall 1: Raw DB Rows Do Not Match ScoreResult
**What goes wrong:** Card expects `totalScore`/`fitLabel` but saved row has `total_score`/`fit_label`, and JSON fields may need validation/casting. [VERIFIED: `types/supabase.ts`; `lib/scoring/schemas.ts:26`]
**Why it happens:** Phase 17 data functions return `OpportunityScoreRow[]`, not `ScoreResult[]`. [VERIFIED: `lib/scoring/data.ts:63`]
**How to avoid:** Plan a small adapter/helper inside the UI component or a server utility. [VERIFIED: code inspection]
**Warning signs:** `as any` spreads from row directly into card props, or missing `score_version` display. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]

### Pitfall 2: Category Key Mismatch
**What goes wrong:** UI spec keys use `locationQuality`/`nearbyBusinesses`, but persisted breakdown entries and DB mapping use `location_quality`/`nearby_businesses`. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`; `lib/scoring/data.ts:42`]
**How to avoid:** Normalize both camelCase and snake_case aliases in the category bar helper. [VERIFIED: code inspection]
**Warning signs:** Bars show `0` or disappear for location/traffic despite saved scores. [VERIFIED: code inspection]

### Pitfall 3: Select Change Recomputes Too Aggressively
**What goes wrong:** Every selection change calls scoring even when a saved row already exists. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]
**How to avoid:** On select, update local selected strategy and show saved score if present; CTA triggers compute/recompute. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]
**Warning signs:** Changing dropdown increments `score_version` without pressing compute/recompute. [VERIFIED: Phase 17 score_version semantics]

### Pitfall 4: Stale Card After Successful Action
**What goes wrong:** Server action succeeds but UI remains in empty state until full refresh completes. [VERIFIED: `lib/actions/scoring-actions.ts:30`]
**How to avoid:** Render `result.score` immediately, then call `router.refresh()` for persisted row/version sync. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`; React docs]
**Warning signs:** CTA spinner ends and no score appears even though the backend saved it. [ASSUMED]

### Pitfall 5: Copy Violates Valuation Constraint
**What goes wrong:** UI says `avaliação`, `valor de mercado`, or appraisal-like wording. [VERIFIED: `.planning/REQUIREMENTS.md`; `.planning/STATE.md`]
**How to avoid:** Use `Pontuação de oportunidade`, `atratividade`, and `fit`. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]
**Warning signs:** Portuguese copy borrows from valuation/product-price language. [VERIFIED: `.planning/REQUIREMENTS.md`]

## Code Examples

### Controlled Strategy Select

```tsx
// Source: components/ui/select.tsx + Radix Select docs
<Select value={value} onValueChange={onChange} disabled={disabled}>
  <SelectTrigger aria-label="Estratégia">
    <SelectValue placeholder="Escolha uma estratégia" />
  </SelectTrigger>
  <SelectContent>
    {STRATEGY_SLUGS.map((slug) => (
      <SelectItem key={slug} value={slug}>
        {STRATEGIES[slug].label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Score Band Helper

```ts
// Source: .planning/phases/18-score-card-ui/18-UI-SPEC.md
function getScoreBand(score: number) {
  if (score >= 70) return { label: 'Forte', color: '#22c55e' }
  if (score >= 50) return { label: 'Moderado', color: '#eab308' }
  if (score >= 40) return { label: 'Baixo', color: '#f97316' }
  return { label: 'Fraco', color: '#ff6868' }
}
```

### Saved Row Adapter Shape

```ts
// Source: lib/scoring/schemas.ts + lib/scoring/data.ts
function scoreRowToCardEntry(row: OpportunityScoreRow): ScoreCardEntry {
  return {
    result: {
      totalScore: Number(row.total_score),
      strategySlug: row.strategy_slug,
      fitLabel: row.fit_label,
      breakdown: Array.isArray(row.breakdown) ? row.breakdown : [],
      signals: Array.isArray(row.signals) ? row.signals : [],
      risks: Array.isArray(row.risks) ? row.risks : [],
      computedAt: row.computed_at,
    },
    scoreVersion: row.score_version,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom client fetches for mutations | Next Server Functions imported into Client Components | Verified in Next v15 docs | Keep scoring mutation as a server action imported into client component. [CITED: https://en.nextjs.im/fr/docs/15/app/api-reference/directives/use-server/] |
| Blocking async UI updates | `useTransition` pending state for async actions | React 19 docs current in session | Use local pending state and disable selector/button during compute. [CITED: https://react.dev/reference/react/useTransition] |
| Bespoke dropdowns | Radix Select via shadcn primitive | Existing project primitive | Use accessible controlled select; no custom dropdown. [VERIFIED: `components/ui/select.tsx`; CITED: https://www.radix-ui.com/primitives/docs/components/select] |

**Deprecated/outdated:**
- Next.js latest registry version is 16.2.6 while project is pinned to 15.5.15; do not upgrade in Phase 18 because this is a UI feature phase and the existing app is on Next 15. [VERIFIED: npm registry; `package.json`]
- React latest registry version is 19.2.6 while project uses 19.1.0; do not upgrade in Phase 18. [VERIFIED: npm registry; `package.json`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A stale card after successful action would appear if local state is not updated before refresh completes. | Common Pitfalls | Low; planner can still require immediate local score render from returned action state. |

## Open Questions (RESOLVED)

1. **Should Phase 18 add Playwright config or use existing local Playwright script only?**
   - What we know: Playwright is installed and ROADMAP requires E2E coverage. [VERIFIED: `package.json`; `.planning/ROADMAP.md`]
   - Prior uncertainty: There is no `playwright.config.*` file currently detected. [VERIFIED: `rg --files`]
   - RESOLVED: Add `playwright.config.ts` in Wave 0 and require deterministic authenticated seeded E2E fixtures. `tests/score-card.e2e.spec.ts` must run the four ROADMAP scenarios with `npx playwright test tests/score-card.e2e.spec.ts`; skipped scaffold tests and manual UAT fallback do not satisfy E2E coverage. [VERIFIED: `.planning/ROADMAP.md`; Next Playwright docs]
2. **Should saved score rows be mapped in `lib/scoring/data.ts` or in UI-local code?**
   - What we know: `lib/scoring/data.ts` currently returns raw rows. [VERIFIED: `lib/scoring/data.ts:63`]
   - Prior uncertainty: Whether backend owners want a reusable `mapRowToScoreResult` exported from scoring data.
   - RESOLVED: Adapt `opportunity_scores` rows server-side into UI props before passing them to the client card. Use a Phase 18 UI helper such as `scoreRowToCardEntry(row)` and pass `ScoreCardEntry[]`; do not trust client-submitted scores, do not spread raw DB rows into client props, and do not change Phase 17 service semantics. [VERIFIED: `lib/scoring/data.ts:63`; `types/supabase.ts`; `lib/scoring/schemas.ts`]
3. **How should the missing-enrichment action path be presented inside the score card?**
   - What we know: UI spec says point to existing enrichment flow and do not invent a new route. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`]
   - Prior uncertainty: Whether to duplicate `LocationInsightAction` in the score empty state or link visually to the existing button above.
   - RESOLVED: Reuse or link to the existing `LocationInsightAction` enrichment path for the missing-enrichment prompt. Do not create a new action, new route, or duplicate enrichment mutation logic inside the score card. [VERIFIED: `components/listings/location-insight-action.tsx`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | `npm test`, Next build | yes | v25.9.0 | None needed. [VERIFIED: `node --version`] |
| npm | scripts, registry checks | yes | 11.12.1 | None needed. [VERIFIED: `npm --version`] |
| Next CLI | build/dev | yes | 15.5.15 | Use package script. [VERIFIED: `npx next --version`] |
| TypeScript | type checks | yes | 5.9.3 | `npm run build` if no separate type script. [VERIFIED: `npx tsc --version`] |
| Playwright | E2E validation | yes | 1.59.1 | Add `playwright.config.ts` and deterministic authenticated seeded fixtures in Wave 0. [VERIFIED: `npx playwright --version`] |
| npm registry network | package version verification | yes with escalation | Verified for Next, React, Radix Select, lucide-react, Playwright | Use local `package.json` when network unavailable. [VERIFIED: npm registry] |

**Missing dependencies with no fallback:**
- None found for implementation. [VERIFIED: environment probes]

**Missing dependencies to create in Wave 0:**
- Playwright config file is absent before Phase 18 execution; Wave 0 must add `playwright.config.ts` rather than falling back to skipped/manual E2E. [VERIFIED: `rg --files`]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit/integration framework | Node built-in test runner via `node --test tests/*.test.mjs`. [VERIFIED: `package.json`] |
| Browser/E2E framework | Playwright package installed; Wave 0 must add config and authenticated seeded fixtures. [VERIFIED: `package.json`; `rg --files`] |
| Config file | `playwright.config.ts` required in Wave 0. [VERIFIED: `rg --files`] |
| Quick run command | `npm test` |
| Lint command | `npm run lint` |
| Full suite command | `npm test && npm run lint && npm run build` |

### Current Baseline

| Command | Result |
|---------|--------|
| `npm test` | 43 passed, 0 failed. [VERIFIED: command output 2026-05-10] |
| `npm run lint` | 0 errors, 9 warnings in existing files. [VERIFIED: command output 2026-05-10] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SCO-13 | Select strategy and trigger score action with loading disabled state | E2E | `npx playwright test tests/score-card.e2e.spec.ts` | No - Wave 0 |
| SCO-14 | Render total score, color band, strategy, fit, five bars, positives, risks | Component/pure helper + E2E | `node --test tests/score-card-ui.test.mjs` | No - Wave 0 |
| SCO-15 | Missing `locationInsight` shows required enrich prompt and no score | E2E + helper copy test | `npx playwright test tests/score-card.e2e.spec.ts` | No - Wave 0 |
| SCO-16 | No saved score for selected strategy shows `Calcular pontuação` CTA | E2E + helper copy test | `npx playwright test tests/score-card.e2e.spec.ts` | No - Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test` plus targeted UI helper test once created. [VERIFIED: project scripts]
- **Per wave merge:** `npm test && npm run lint`. [VERIFIED: project scripts]
- **Phase gate:** `npm test && npm run lint && npm run build`, plus `npx playwright test tests/score-card.e2e.spec.ts` running the four ROADMAP E2E scenarios with authenticated seeded data. Manual visual UAT is additional polish verification only. [VERIFIED: `.planning/ROADMAP.md`; Next Playwright docs]

### Wave 0 Gaps

- [ ] `tests/score-card-ui.test.mjs` - pure helper tests for score band thresholds, category ordering/alias normalization, row adapter, and empty-state copy. [VERIFIED: no file detected]
- [ ] `playwright.config.ts`, `tests/fixtures/score-card-e2e.ts`, and `tests/score-card.e2e.spec.ts` - required automated E2E coverage for ROADMAP scenarios. [VERIFIED: no config detected]
- [ ] Deterministic authenticated seeded fixtures for one listing with `location_insights` and no saved score, one listing with `location_insights` and a saved score, and one listing without `location_insights`. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Server page and scoring action use Supabase `getUser()` before user-scoped reads/mutations. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:27`; `lib/actions/scoring-actions.ts:17`] |
| V3 Session Management | yes | Reuse existing `@supabase/ssr` server client; do not inspect session client-side for authorization. [VERIFIED: `.planning/STATE.md`] |
| V4 Access Control | yes | All score reads must include `user_id`; existing `getScoreHistory` accepts `userId` and filters by it. [VERIFIED: `lib/scoring/data.ts:72`] |
| V5 Input Validation | yes | Strategy slugs are validated by `scoreListingAction` against `STRATEGY_SLUGS`. [VERIFIED: `lib/actions/scoring-actions.ts:20`] |
| V6 Cryptography | no | Phase 18 introduces no crypto. [VERIFIED: phase scope] |

### Known Threat Patterns for Phase 18

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User selects forged strategy slug | Tampering | Server action validates slug; UI must still source options from `STRATEGY_SLUGS`. [VERIFIED: `lib/actions/scoring-actions.ts:20`; `lib/scoring/strategies.ts:4`] |
| Cross-user score leakage in listing detail | Information Disclosure | Server page must pass authenticated `user.id` into saved score query. [VERIFIED: `app/(app)/imoveis/[id]/page.tsx:27`; `lib/scoring/data.ts:63`] |
| Trusting client score values | Tampering | Client never computes/saves score; only renders server action result and saved rows. [VERIFIED: phase scope; `lib/actions/scoring-actions.ts`] |
| Over-disclosing raw scoring JSON | Information Disclosure | Render only UI-approved fields, top 3 signals/risks, and score metadata. [VERIFIED: `.planning/phases/18-score-card-ui/18-UI-SPEC.md`] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/18-score-card-ui/18-CONTEXT.md` - user decisions, scope, canonical refs.
- `.planning/phases/18-score-card-ui/18-UI-SPEC.md` - approved visual and interaction contract.
- `.planning/REQUIREMENTS.md` - SCO-13 through SCO-16.
- `.planning/STATE.md` and `.planning/ROADMAP.md` - milestone state, dependencies, success criteria.
- `app/(app)/imoveis/[id]/page.tsx` - listing detail SSR integration point.
- `components/listings/location-insight-action.tsx` - client action pattern.
- `lib/actions/scoring-actions.ts`, `lib/scoring/schemas.ts`, `lib/scoring/strategies.ts`, `lib/scoring/data.ts` - scoring action/type/data contracts.
- npm registry - current versions for Next, React, Radix Select, lucide-react, Playwright.
- React docs - `useTransition` pending-state/action behavior: https://react.dev/reference/react/useTransition
- Next docs - Server Functions and revalidation: https://en.nextjs.im/fr/docs/15/app/api-reference/directives/use-server/ and https://en.nextjs.im/es/docs/15/app/getting-started/caching-and-revalidating/
- Radix Select docs - controlled Select and accessibility behavior: https://www.radix-ui.com/primitives/docs/components/select
- Next Playwright docs - E2E setup and server requirement: https://nextjs.org/docs/app/guides/testing/playwright

### Secondary (MEDIUM confidence)

- `.planning/graphs/graph.json` - graph exists but stale by 177 hours and returned no useful Phase 18 nodes. [VERIFIED: graphify status/query]

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - installed versions, local commands, and npm registry checks verified.
- Architecture: HIGH - existing listing page/action/data files directly map to Phase 18.
- Pitfalls: HIGH - most risks are direct schema/UI-contract mismatches found in code.
- E2E validation: MEDIUM - Playwright package is installed, but no config exists yet.

**Research date:** 2026-05-10
**Valid until:** 2026-06-09 for project-local architecture; 2026-05-17 for latest npm version metadata.
