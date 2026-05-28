# Phase 18: Score Card UI - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the broker-facing scoring experience on the listing detail page (`/imoveis/[id]`): strategy selection, score computation trigger, compact explainable score card, score empty states, and score metadata/history cues. This phase is UI-only; scoring engine logic, persistence, server actions, and API routes are Phase 16/17 outputs and should be reused rather than redesigned.

**Out of scope:** Changing scoring formulas, adding new strategies, changing the `opportunity_scores` schema, or converting score history into a time-series model.

</domain>

<decisions>
## Implementation Decisions

### Score Card Composition
- **D-01:** The score card should use a **compact scan first** layout. The broker should immediately see total score, selected strategy, fit label, top positives, top risks, and the category breakdown without scrolling through a long explanation-first panel.
- **D-02:** The total score should be visually prioritized as a **large numeric score inside a thin circular ring**, matching the DMDI-style circular reference language while staying usable in the dark dashboard UI.
- **D-03:** The card should show **five slim category bars always visible** for the scoring categories: demographics, location quality, foot traffic potential, competition, and risk. Do not hide the breakdown behind a details toggle in the first implementation.
- **D-04:** Positive signals and risk flags should render as **two side-by-side lists** in the compact card: `Pontos fortes` and `Riscos`, capped at 3 items each. On narrow mobile widths these can stack vertically, but the semantic split should remain.

### Carried Forward Constraints
- **D-05:** Missing `location_insights` is an explicit empty state, not an error and not a blank region. The UI copy must include: `Enriqueça a localização antes de calcular a pontuação`.
- **D-06:** Score framing must use opportunity/fit language such as `pontuação de oportunidade`, `atratividade`, or `fit`. Do not label it as `avaliação`, because formal property valuation is regulated in Brazil.
- **D-07:** Saved score history is not a time series. One current row exists per `(user_id, listing_id, strategy_slug)`, and `score_version` communicates recompute count.

### the agent's Discretion
- Exact spacing, typography scale, and responsive breakpoints within the current dark, sharp RealTools UI system.
- Exact copy for secondary labels, as long as required Portuguese strings and score framing constraints are preserved.
- Whether the circular score ring is implemented with CSS conic gradients or SVG, as long as it is accessible and does not introduce a chart dependency for this simple visual.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements
- `.planning/ROADMAP.md` — Phase 18 goal, success criteria, dependencies, and UI hint.
- `.planning/REQUIREMENTS.md` — SCO-13, SCO-14, SCO-15, SCO-16 UI requirements and out-of-scope scoring constraints.
- `.planning/STATE.md` — Current v1.6 decisions, score framing constraints, and scoring engine caveats.

### Prior Scoring Phases
- `.planning/phases/16-scoring-engine-foundation/16-SUMMARY.md` — Scoring engine outputs, strategy profiles, fit labels, and score payload shape.
- `.planning/phases/17-service-wiring-and-api/17-CONTEXT.md` — Server action return shape, best-fit/history decisions, and Phase 18 integration notes.

### Scoring Code
- `lib/actions/scoring-actions.ts` — `scoreListingAction(listingId, strategySlug)` and `getBestFitAction(listingId)` action contracts.
- `lib/scoring/schemas.ts` — `ScoreResult`, `CategoryBreakdown`, `ScoreSignal`, `ScoreRisk`, and `ScoringActionState` types.
- `lib/scoring/strategies.ts` — Strategy slugs and Portuguese strategy labels.
- `lib/scoring/data.ts` — Saved score/history semantics and `score_version` behavior.

### Listing Detail Integration
- `app/(app)/imoveis/[id]/page.tsx` — Listing detail page where the strategy selector and opportunity score card must be integrated below the location insight section.
- `components/listings/location-insight-card.tsx` — Existing card/list/badge patterns for location intelligence display.
- `components/listings/location-insight-action.tsx` — Existing client action pattern with `useTransition`, loading state, action result handling, and `router.refresh()`.

### UI Primitives
- `components/ui/card.tsx` — Shared card primitive and current sharp dark UI surface.
- `components/ui/button.tsx` — Shared button variants and loading icon conventions.
- `components/ui/select.tsx` — Existing select primitive for the strategy dropdown.
- `components/ui/badge.tsx` — Shared badge primitive for fit/strategy labels.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scoreListingAction` from `lib/actions/scoring-actions.ts`: client components should call this to compute/recompute a score, then refresh listing detail data.
- `STRATEGIES` / `STRATEGY_SLUGS` from `lib/scoring/strategies.ts`: source of truth for strategy options and Portuguese labels.
- `ScoringActionState` and `ScoreResult` from `lib/scoring/schemas.ts`: source of truth for score card props/action state.
- `LocationInsightAction`: closest client action analog for pending state, result message handling, and `router.refresh()`.
- `Card`, `Button`, `Select`, and `Badge` primitives: use these rather than introducing a new component style system.

### Established Patterns
- Listing detail page is a server component that loads listing + `locationInsight`, then passes listing data into client-side action components where interactivity is needed.
- Existing mutation UI uses `useTransition` for server actions and `router.refresh()` after a successful mutation.
- Current UI direction is dark, monochrome, sharp-cornered, with thin borders and restrained shadows.

### Integration Points
- Add Phase 18 UI below the existing location insight section in `app/(app)/imoveis/[id]/page.tsx`.
- New likely components: `components/listings/strategy-selector.tsx` and `components/listings/opportunity-score-card.tsx`.
- The no-enrichment prompt should connect to the existing enrichment flow instead of creating a new route or workflow.

</code_context>

<specifics>
## Specific Ideas

- First-view score card hierarchy: circular score ring + score number, strategy label, fit label, five category bars, then two insight lists.
- Compact signals: show at most 3 positive signals and 3 risk flags in the default view. Extra signals/risks can be omitted or left for future detail expansion.
- Category bars should use Portuguese labels and fixed category order so brokers can compare listings quickly.

</specifics>

<deferred>
## Deferred Ideas

- Full expand/collapse detail mode for every category signal and risk — not required for Phase 18 first implementation.
- Score comparison across listings — future requirement SCO-21 / SCO-F2.
- Score trend chart across historical versions — future requirement SCO-F1, blocked by current non-time-series history model.

</deferred>

---

*Phase: 18-score-card-ui*
*Context gathered: 2026-05-10*
