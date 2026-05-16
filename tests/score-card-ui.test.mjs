import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  SCORE_CARD_COPY,
  getScoreBand,
  getCategoryRows,
  scoreRowToCardEntry,
  getFitLabelText,
} = require('../lib/scoring/score-card-ui.js')

function makeScoreRow(overrides = {}) {
  return {
    id: 'score-001',
    user_id: 'user-001',
    listing_id: 'listing-001',
    strategy_slug: 'cafe',
    total_score: 70,
    score_version: 2,
    fit_label: 'forte',
    computed_at: '2026-05-11T09:00:00.000Z',
    breakdown: [
      { category: 'demographics', label: 'Demografia', score: 68, weight: 0.2, weighted: 13.6 },
      { category: 'location_quality', label: 'Qualidade', score: 72, weight: 0.2, weighted: 14.4 },
      { category: 'nearby_businesses', label: 'Fluxo', score: 80, weight: 0.3, weighted: 24 },
      { category: 'competition', label: 'Concorrência', score: 55, weight: 0.15, weighted: 8.25 },
      { category: 'risk', label: 'Risco', score: 76, weight: 0.1, weighted: 7.6 },
      { category: 'investor_fit', label: 'Fit investidor', score: 66, weight: 0.05, weighted: 3.3 },
    ],
    signals: [{ category: 'nearby_businesses', label: 'Fluxo forte', impact: 'positive' }],
    risks: [{ category: 'competition', label: 'Concorrência próxima', severity: 'medium' }],
    created_at: '2026-05-11T09:00:00.000Z',
    updated_at: '2026-05-11T09:00:00.000Z',
    demographics_score: 68,
    location_score: 72,
    foot_traffic_score: 80,
    competition_score: 55,
    risk_score: 76,
    investor_fit_score: 66,
    engine_version: '1.0',
    ...overrides,
  }
}

test('getScoreBand returns the Phase 18 band labels and colors', () => {
  assert.deepEqual(getScoreBand(70), { label: 'Forte', color: '#22c55e' })
  assert.deepEqual(getScoreBand(50), { label: 'Moderado', color: '#eab308' })
  assert.deepEqual(getScoreBand(40), { label: 'Baixo', color: '#f97316' })
  assert.deepEqual(getScoreBand(39), { label: 'Fraco', color: '#ff6868' })
})

test('getCategoryRows returns exactly the fixed five display categories', () => {
  const rows = getCategoryRows([
    { category: 'investorFit', score: 99 },
    { category: 'risk', score: 40 },
    { category: 'nearbyBusinesses', score: 65 },
    { category: 'competition', score: 70 },
    { category: 'locationQuality', score: 82 },
    { category: 'demographics', score: 74 },
  ])

  assert.deepEqual(rows.map((row) => row.key), [
    'demographics',
    'locationQuality',
    'nearbyBusinesses',
    'competition',
    'risk',
  ])
  assert.equal(rows.length, 5)
})

test('getCategoryRows accepts snake case aliases from persisted score JSON', () => {
  const rows = getCategoryRows([
    { category: 'location_quality', score: 82 },
    { category: 'nearby_businesses', score: 65 },
  ])

  assert.equal(rows.find((row) => row.key === 'locationQuality')?.score, 82)
  assert.equal(rows.find((row) => row.key === 'nearbyBusinesses')?.score, 65)
  assert.equal(rows.find((row) => row.key === 'demographics')?.score, 0)
})

test('scoreRowToCardEntry maps persisted score rows without leaking raw row fields', () => {
  const entry = scoreRowToCardEntry(makeScoreRow())

  assert.equal(entry.scoreVersion, 2)
  assert.equal(entry.result.totalScore, 70)
  assert.equal(entry.result.strategySlug, 'cafe')
  assert.equal(entry.result.fitLabel, 'forte')
  assert.equal(entry.result.computedAt, '2026-05-11T09:00:00.000Z')
  assert.equal(entry.result.breakdown.length, 6)
  assert.equal(entry.result.signals[0].label, 'Fluxo forte')
  assert.equal(entry.result.risks[0].severity, 'medium')
  assert.equal('user_id' in entry, false)
  assert.equal('listing_id' in entry, false)
})

test('required score card copy is stable for the component plan', () => {
  assert.equal(SCORE_CARD_COPY.missingEnrichment, 'Enriqueça a localização antes de calcular a pontuação')
  assert.equal(SCORE_CARD_COPY.primaryCta, 'Calcular pontuação')
  assert.equal(SCORE_CARD_COPY.recomputeCta, 'Recalcular pontuação')
  assert.equal(SCORE_CARD_COPY.loading, 'Calculando...')
  assert.equal(SCORE_CARD_COPY.signalsTitle, 'Pontos fortes')
  assert.equal(SCORE_CARD_COPY.risksTitle, 'Riscos')
  assert.equal(getFitLabelText('forte'), 'Forte')
  assert.equal(getFitLabelText('moderado'), 'Moderado')
  assert.equal(getFitLabelText('fraco'), 'Fraco')
})

test('Phase 18 helper and listing sources avoid forbidden valuation language', () => {
  const forbidden = ['aval', 'iação'].join('')
  const forbiddenMarket = ['valor', ' de ', 'mercado'].join('')
  const files = [
    'lib/scoring/score-card-ui.ts',
    'tests/score-card-ui.test.mjs',
    'components/listings/opportunity-score-card.tsx',
    'components/listings/location-insight-action.tsx',
    'components/listings/location-insight-card.tsx',
    'components/listings/listing-images.tsx',
    'components/listings/import-actions.tsx',
    'components/listings/import-runs-table.tsx',
    'components/listings/import-targets-table.tsx',
  ]

  for (const file of files) {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    assert.equal(source.includes(forbidden), false, `${file} contains forbidden copy`)
    assert.equal(source.includes(forbiddenMarket), false, `${file} contains forbidden market copy`)
  }
})

test('OpportunityScoreCard source wires server action and route refresh', () => {
  const source = readFileSync(join(process.cwd(), 'components/listings/opportunity-score-card.tsx'), 'utf8')

  assert.match(source, /export function OpportunityScoreCard/)
  assert.match(source, /<StrategySelector/)
  assert.match(source, /scoreListingAction\(listingId, selectedStrategy\)/)
  assert.match(source, /router\.refresh\(\)/)
  assert.match(source, /useTransition/)
  assert.match(source, /slice\(0, 3\)/)
})

test('OpportunityScoreCard source preserves required copy and category invariants', () => {
  const source = readFileSync(join(process.cwd(), 'components/listings/opportunity-score-card.tsx'), 'utf8')
  const helperSource = readFileSync(join(process.cwd(), 'lib/scoring/score-card-ui.ts'), 'utf8')

  assert.match(`${source}\n${helperSource}`, /Pontuação de oportunidade/)
  assert.match(`${source}\n${helperSource}`, /Calcular pontuação/)
  assert.match(`${source}\n${helperSource}`, /Recalcular pontuação/)
  assert.match(`${source}\n${helperSource}`, /Enriqueça a localização antes de calcular a pontuação/)
  assert.deepEqual(getCategoryRows().map((row) => row.key), [
    'demographics',
    'locationQuality',
    'nearbyBusinesses',
    'competition',
    'risk',
  ])
  assert.equal(getCategoryRows().some((row) => row.key === 'investorFit'), false)
})
