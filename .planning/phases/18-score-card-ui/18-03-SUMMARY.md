---
phase: 18-score-card-ui
plan: 03
subsystem: ui
tags: [opportunity-score-card, server-actions, score-ring, ui-tests]
requires:
  - phase: 18-score-card-ui
    provides: Plans 18-01 and 18-02 helper/test foundation and strategy selector
provides:
  - Interactive opportunity score card component
  - Source-level tests for score card wiring and copy invariants
affects: [listing-detail, score-card-ui, opportunity-scoring]
tech-stack:
  added: []
  patterns: [useTransition server action flow, compact score card with fixed ring and bars]
key-files:
  created:
    - components/listings/opportunity-score-card.tsx
  modified:
    - tests/score-card-ui.test.mjs
key-decisions:
  - "The card sends only listingId and selectedStrategy to scoreListingAction; it never computes score values client-side."
  - "The full Playwright workflow stays deferred to Plan 18-04 after page integration."
patterns-established:
  - "Score card UI uses helper constants for Portuguese copy and display-safe score rows."
  - "Signals and risks are capped at three labels each and never render raw JSON."
requirements-completed: [SCO-13, SCO-14, SCO-15, SCO-16]
duration: 30min
completed: 2026-05-11
---

# Phase 18: Score Card UI Plan 03 Summary

**Interactive opportunity score card with server-action scoring, compact ring/bars layout, and source-level UI invariants**

## Performance

- **Duration:** 30 min
- **Started:** 2026-05-11T00:45:00+01:00
- **Completed:** 2026-05-11T01:15:00+01:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `OpportunityScoreCard` with strategy selector composition, compute/recompute CTA, pending state, action messages, and `router.refresh()` after successful scoring.
- Rendered the compact card contract: circular score ring, strategy/fit badges, score version, five category bars, and split `Pontos fortes` / `Riscos` lists capped at three.
- Added tests for component source wiring, required copy, forbidden valuation language, and category display invariants.

## Task Commits

1. **Task 1: Build score card states and rendering** - `16b293f`
2. **Task 2: Expand score card UI tests** - `75e483c`

## Files Created/Modified

- `components/listings/opportunity-score-card.tsx` - Interactive score card client component.
- `tests/score-card-ui.test.mjs` - Expanded helper and source-level UI tests.

## Decisions Made

- Kept the missing-enrichment state as an explicit empty state and left the actual enrichment action owned by the existing location intelligence section.
- Kept server action errors non-destructive: previous/current score remains visible if recompute fails.

## Deviations from Plan

None.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

Plan 18-04 can server-load saved scores, adapt rows with `scoreRowToCardEntry`, render this component below location intelligence, and make the Playwright E2E suite green.

---
*Phase: 18-score-card-ui*
*Completed: 2026-05-11*
