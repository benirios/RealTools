# Phase 18: Score Card UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 18-score-card-ui
**Areas discussed:** Score card composition

---

## Score Card Composition

### First View Density

| Option | Description | Selected |
|--------|-------------|----------|
| Compact scan first | Total score, strategy, fit label, top positives, top risks; category breakdown below. Best for fast listing qualification. | ✓ |
| Full explainability first | Total score plus every category, signal, and risk visible immediately. More transparent, but heavier on the listing page. | |
| Summary with expand/collapse | Compact default with expandable category details. Balanced, but adds interaction complexity. | |

**User's choice:** Compact scan first.
**Notes:** Broker should be able to qualify a listing quickly from the first view.

### Score Emphasis

| Option | Description | Selected |
|--------|-------------|----------|
| Large numeric score with thin circular ring | Matches the DMDI-style circular reference while staying dashboard-friendly. | ✓ |
| Horizontal score band | More compact and easy to align with bars, but less distinctive. | |
| Plain number + badge | Simplest implementation, but less premium. | |

**User's choice:** Large numeric score with thin circular ring.
**Notes:** Keep the circular reference language while preserving app usability.

### Category Breakdown

| Option | Description | Selected |
|--------|-------------|----------|
| Five slim bars always visible | Demographics, location, foot traffic, competition, risk; instant explainability without too much weight. | ✓ |
| Only top 2 categories visible | Cleaner, but hides why the score landed where it did. | |
| Breakdowns hidden behind Ver detalhes | Most compact, but weakens explainability. | |

**User's choice:** Five slim category bars always visible.
**Notes:** Category explanation should be available without a toggle.

### Signals and Risks

| Option | Description | Selected |
|--------|-------------|----------|
| Two side-by-side lists | `Pontos fortes` and `Riscos`, capped at 3 items each in the compact card. | ✓ |
| Single mixed insight list | Easier on mobile, but risks/positives are less scannable. | |
| Icon chips | Compact and visual, but can become vague if labels are long. | |

**User's choice:** Two side-by-side lists, capped at 3 positive signals and 3 risk flags.
**Notes:** Stack vertically on mobile if needed, but preserve the semantic split.

---

## the agent's Discretion

- Exact spacing, responsive layout, and secondary copy inside the current dark/sharp UI direction.
- Implementation technique for the circular score ring.
- Whether extra signals/risks are omitted or deferred to a later expanded detail state.

## Deferred Ideas

- Expand/collapse full category detail mode.
- Score comparison across listings.
- Score trend chart across historical versions.
