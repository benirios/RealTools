---
phase: 17
slug: service-wiring-and-api
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-10
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in, Node 25.9.0) |
| **Config file** | none — tests run via `node --test tests/*.test.mjs` |
| **Quick run command** | `node --test tests/scoring-service.test.mjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/scoring-service.test.mjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (scoring-service tests all passing)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | SCO-09, SCO-10 | T-17-01 | upsertScore filters by user_id | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | SCO-11, SCO-20 | T-17-01 | recompute increments score_version | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | SCO-09, SCO-12 | T-17-02 | service calls getUser(), filters user_id | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 1 | SCO-18 | T-17-02 | missing location_insights returns Portuguese error | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-03-01 | 03 | 2 | SCO-09, SCO-12 | T-17-03 | POST enforces getUser() at route level | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-03-02 | 03 | 2 | SCO-10 | T-17-04 | GET returns saved score for strategy param | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-04-01 | 04 | 2 | SCO-19 | T-17-05 | getBestFitAction returns cafe as top strategy | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |
| 17-04-02 | 04 | 2 | SCO-18 | — | full round-trip save/fetch succeeds | integration | `node --test tests/scoring-service.test.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/scoring-service.test.mjs` — stub file with test descriptions for SCO-09 through SCO-20
- [ ] CJS compilation note: data.ts and service.ts must produce `.js` files alongside `.ts` (same as Phase 16 engine) OR tests must use `tsx` for direct `.ts` import

*Note: existing `node:test` + CJS shim infrastructure from Phase 16 (`tests/scoring-engine.test.mjs`) is the direct model.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API route returns 401 for unauthenticated requests | SCO-12 | Requires real Supabase session | curl POST without auth cookie, verify 401 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
