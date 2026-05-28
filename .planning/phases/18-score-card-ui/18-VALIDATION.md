---
phase: 18
slug: score-card-ui
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-10
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in test runner plus required Playwright E2E |
| **Config file** | `package.json`; Wave 0 adds `playwright.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run lint && npm run build && npx playwright test tests/score-card.e2e.spec.ts` |
| **Estimated runtime** | Fast loop ~30 seconds; full E2E/phase gate may exceed 90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run lint`
- **Before `$gsd-verify-work`:** `npm test && npm run lint && npm run build && npx playwright test tests/score-card.e2e.spec.ts`
- **Max fast-loop feedback latency:** 120 seconds
- **Accepted high-latency exception:** Phase 18 intentionally keeps `npx playwright test tests/score-card.e2e.spec.ts` as a required final phase gate because ROADMAP success criteria require automated browser coverage for strategy selection, missing enrichment, no-score CTA, and strategy-change workflows. Wave 0 validates only spec discoverability with `npx playwright test --list tests/score-card.e2e.spec.ts`; the full E2E command runs after Plan 04 integration and must not be replaced by skips or manual UAT.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 0 | SCO-14, SCO-15, SCO-16 | — | N/A | unit/helper | `node --test tests/score-card-ui.test.mjs` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 0 | SCO-13, SCO-14, SCO-15, SCO-16 | T-18-01 / T-18-02 | UI test fixtures must use authenticated seeded data and must not bypass auth-sensitive server action behavior | e2e scaffold | `npx playwright test --list tests/score-card.e2e.spec.ts` | ❌ W0 | ⬜ pending |
| 18-02-01 | 02 | 1 | SCO-13 | T-18-01 | Strategy options sourced from `STRATEGY_SLUGS`; server action remains validation authority | unit/helper | `node --test tests/score-card-ui.test.mjs` | ❌ W0 | ⬜ pending |
| 18-03-01 | 03 | 2 | SCO-14, SCO-16 | T-18-02 / T-18-03 | Saved rows mapped by authenticated server page; client renders only server-provided/action-returned score data | unit/helper | `node --test tests/score-card-ui.test.mjs` | ❌ W0 | ⬜ pending |
| 18-04-01 | 04 | 3 | SCO-13, SCO-14, SCO-15, SCO-16 | T-18-01 / T-18-02 / T-18-03 | Listing page keeps user-scoped listing and score queries; no client-side score computation | phase gate + e2e | `npm test && npm run lint && npm run build && npx playwright test tests/score-card.e2e.spec.ts` | ✅ existing scripts / ❌ W0 E2E config | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/score-card-ui.test.mjs` — helper tests for score band thresholds, fixed five-category ordering, category key alias normalization, saved row adapter, required empty-state copy, and forbidden `avaliação` copy.
- [ ] `playwright.config.ts` — required config for Phase 18 automated E2E.
- [ ] `tests/fixtures/score-card-e2e.ts` — deterministic authenticated fixture helper for one listing with `location_insights` and no saved score, one listing with `location_insights` and a saved score, and one listing without `location_insights`.
- [ ] `tests/score-card.e2e.spec.ts` — required automated scenarios for: select strategy -> score appears; no `location_insights` -> enrichment prompt; no saved score -> `Calcular pontuação`; strategy change -> card updates. Wave 0 must create a discoverable non-skipped spec and deterministic fixtures; Plan 04 owns the green `npx playwright test tests/score-card.e2e.spec.ts` run after UI integration exists.

---

## Additional Manual Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual polish of circular score ring, dark contrast, and mobile stacking | SCO-14 | Pixel-perfect visual quality is not fully covered by Node tests or Playwright assertions | Open `/imoveis/[id]` for a listing with score data at mobile and desktop widths; confirm ring, five bars, and signal/risk lists are visible without overlap. |
| Missing enrichment user path polish | SCO-15 | Playwright covers the behavior; human review checks clarity and placement | Open a listing without `location_insights`; confirm exact copy `Enriqueça a localização antes de calcular a pontuação` and an obvious path to run enrichment. |

Manual verification is additional polish review only. It is not a substitute for `npx playwright test tests/score-card.e2e.spec.ts`.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [x] Fast-loop feedback latency < 120s; required Playwright/full-suite phase gate accepted as explicit high-latency exception
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planning-approved; execution results pending
