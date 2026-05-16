import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { calculateInvestorDealMatch, rankInvestorDeals } = require('../lib/investors/matching.js')

const baseInvestor = {
  budget_min: 200000,
  budget_max: 500000,
  preferred_neighborhoods: ['Boa Viagem'],
  property_types: ['loja'],
  strategy: 'rental_income',
  risk_level: 'low',
  tags: ['retail_focus', 'high_yield'],
}

const baseDeal = {
  title: 'Loja comercial em Boa Viagem',
  price_amount: 400000,
  neighborhood: 'Boa Viagem',
  property_type: 'loja',
  confidence: 90,
  tags: ['retail_focus', 'high_yield', 'stable'],
  description: 'Loja comercial com aluguel ativo',
  opportunity_score: 82,
  strategy_fit_scores: [
    {
      strategy: 'rental_income',
      score: 86,
      confidence: 'high',
    },
  ],
  location_insight: {
    avg_income: 6500,
    population_density: 7200,
    confidence_score: 86,
    nearby_businesses: [
      { name: 'Banco', category: 'bank' },
      { name: 'Mercado', category: 'supermarket' },
      { name: 'Escola', category: 'school' },
      { name: 'Farmacia', category: 'pharmacy' },
      { name: 'Parada', category: 'transit' },
    ],
  },
}

test('budget matching gives full score inside budget', () => {
  const result = calculateInvestorDealMatch(baseInvestor, baseDeal)
  assert.equal(result.breakdown.budget_fit, 100)
  assert.ok(result.strengths.includes('Price fits the investor budget range.'))
})

test('location matching gives full score for preferred neighborhood', () => {
  const result = calculateInvestorDealMatch(baseInvestor, baseDeal)
  assert.equal(result.breakdown.location_fit, 100)
})

test('property type matching compares deal property type with investor preferences', () => {
  const result = calculateInvestorDealMatch(baseInvestor, baseDeal)
  assert.equal(result.breakdown.property_type_fit, 100)
  assert.ok(result.strengths.some((reason) => reason.includes('loja')))
})

test('tag overlap adds bonus and readable shared tag reason', () => {
  const result = calculateInvestorDealMatch(baseInvestor, baseDeal)
  assert.equal(result.breakdown.tag_fit, 100)
  assert.ok(result.strengths.some((reason) => reason.includes('retail_focus')))
})

test('opportunity score, strategy fit and local intelligence contribute to compatibility', () => {
  const result = calculateInvestorDealMatch(baseInvestor, baseDeal)

  assert.equal(result.breakdown.strategy_fit, 86)
  assert.ok(result.breakdown.opportunity_quality >= 80)
  assert.ok(result.strengths.includes('Universal opportunity score is strong.'))
  assert.ok(result.strengths.includes('Local intelligence shows strong demographic and business signals.'))
  assert.ok(result.explanation.includes('match'))
  assert.ok(['low', 'medium', 'high'].includes(result.confidence))
})

test('rankInvestorDeals sorts by final score descending', () => {
  const weakDeal = {
    ...baseDeal,
    price_amount: 900000,
    neighborhood: 'Pina',
    property_type: 'galpao',
    tags: [],
    description: 'Galpao sem renda',
    confidence: 40,
  }

  const ranked = rankInvestorDeals(baseInvestor, [weakDeal, baseDeal])
  assert.equal(ranked[0].deal.title, baseDeal.title)
  assert.ok(ranked[0].match_score > ranked[1].match_score)
})

test('no investor preferences does not punish too harshly', () => {
  const result = calculateInvestorDealMatch({
    name: 'Open investor',
    strategy: 'any',
    risk_level: 'any',
    tags: [],
    property_types: [],
    preferred_neighborhoods: [],
  }, baseDeal)

  assert.ok(result.match_score >= 60)
  assert.equal(result.match_status, 'strong')
})

test('deal above budget by up to 15 percent gets partial budget score', () => {
  const result = calculateInvestorDealMatch(baseInvestor, {
    ...baseDeal,
    price_amount: 560000,
  })

  assert.equal(result.breakdown.budget_fit, 55)
  assert.ok(result.concerns.includes('Price is slightly above budget but within 15% tolerance.'))
})
