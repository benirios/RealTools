import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { STRATEGY_FIT_SLUGS, calculateStrategyFitScore } = require('../lib/scoring/strategy-fit.js')

const point = {
  id: 'listing-001',
  title: 'Loja de frente locada em Boa Viagem',
  price_amount: 420000,
  property_type: 'loja',
  commercial_type: 'ponto_comercial',
  tags: ['street_front', 'leased', 'stable', 'retail_focus'],
  lat: -8.12,
  description: 'Ponto comercial com vitrine, contrato de aluguel ativo e alto fluxo.',
  location_insight: {
    avg_income: 6500,
    population_density: 7800,
    confidence_score: 88,
    latitude: -8.12,
    nearby_businesses: [
      { name: 'Shopping', category: 'mall', distanceMeters: 300 },
      { name: 'Banco', category: 'bank', distanceMeters: 250 },
      { name: 'Mercado', category: 'supermarket', distanceMeters: 350 },
      { name: 'Escola', category: 'school', distanceMeters: 400 },
      { name: 'Parada', category: 'transit', distanceMeters: 100 },
    ],
  },
}

test('calculateStrategyFitScore returns requested structured shape', () => {
  const result = calculateStrategyFitScore(point, 'retail')

  assert.equal(result.strategy, 'retail')
  assert.ok(result.score >= 0 && result.score <= 100)
  assert.ok(['low', 'medium', 'high'].includes(result.confidence))
  assert.deepEqual(Object.keys(result.breakdown).sort(), [
    'commercial_activity',
    'demographics',
    'location',
    'risk_adjusted',
  ])
  assert.ok(Array.isArray(result.strengths))
  assert.ok(Array.isArray(result.weaknesses))
  assert.ok(Array.isArray(result.best_fit_reasons))
  assert.ok(Array.isArray(result.missing_data))
})

test('different strategies produce different fit scores on same point', () => {
  const retail = calculateStrategyFitScore(point, 'retail')
  const warehouse = calculateStrategyFitScore(point, 'warehouse_logistics')

  assert.notEqual(retail.score, warehouse.score)
  assert.ok(retail.score > warehouse.score, `retail ${retail.score} should beat warehouse ${warehouse.score}`)
})

test('missing enrichment lowers confidence instead of inventing certainty', () => {
  const result = calculateStrategyFitScore({ id: 'listing-002', title: 'Ponto comercial' }, 'pharmacy')

  assert.equal(result.confidence, 'low')
  assert.ok(result.missing_data.includes('location_insight'))
  assert.ok(result.missing_data.includes('older_population'))
})

test('all supported V1 strategies are accepted', () => {
  for (const strategy of STRATEGY_FIT_SLUGS) {
    const result = calculateStrategyFitScore(point, strategy)
    assert.equal(result.strategy, strategy)
  }
})
