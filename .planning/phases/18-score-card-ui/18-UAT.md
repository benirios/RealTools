---
status: complete
phase: 18-score-card-ui
source:
  - 18-01-SUMMARY.md
  - 18-02-SUMMARY.md
  - 18-03-SUMMARY.md
  - 18-04-SUMMARY.md
started: 2026-05-12T12:07:15Z
updated: 2026-05-12T12:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Strategy Selector and No-Score CTA
expected: On a listing detail page with location intelligence but no saved score for the selected strategy, the score section appears directly below location intelligence. The strategy field is labeled "Estratégia", the selector shows Portuguese strategy options, and the primary action is "Calcular pontuação" without showing fake score bars or a neutral placeholder score.
result: pass

### 2. Compute Score and Display Card
expected: Choosing a strategy and clicking "Calcular pontuação" shows the "Calculando..." loading state, then renders "Pontuação de oportunidade" with the selected strategy label, fit label, total score ring, five criterion bars, "Pontos fortes", and "Riscos".
result: pass

### 3. Missing Enrichment Empty State
expected: On a listing without location intelligence, the score section renders the exact prompt "Enriqueça a localização antes de calcular a pontuação" as an empty state, keeps the enrichment path visible above it, and does not show an error or blank score card.
result: pass

### 4. Saved Score Loads Server-Side
expected: On a listing with a saved score, the score card appears on first page load below location intelligence with the saved strategy label and "Versão {score_version}" metadata, without requiring a client fetch or recompute click.
result: pass

### 5. Strategy Change Updates Card
expected: Changing the strategy updates the selected strategy locally. If no saved score exists for that strategy, the CTA is available; after computing, the card updates to the new strategy and still shows the score ring, criteria, strengths, risks, and version metadata.
result: pass

### 6. Visual Polish and Forbidden Copy
expected: At desktop and mobile widths, the score ring, five category bars, and "Pontos fortes" / "Riscos" lists fit without overlap. The score UI uses opportunity/fit language and does not show "avaliação", "valor de mercado", or formal valuation wording.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
