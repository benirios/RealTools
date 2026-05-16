import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  scoreDemographics,
  scoreLocationQuality,
  scoreNearbyBusinesses,
  scoreCompetition,
  computeScore,
  RuleBasedScoringEngine,
} = require('../lib/scoring/engine.js')
const { STRATEGIES, getStrategy } = require('../lib/scoring/strategies.js')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeListing(overrides = {}) {
  return {
    id: 'listing-001',
    user_id: 'user-001',
    title: 'Ponto Comercial Boa Viagem',
    source: 'olx',
    source_url: 'https://olx.com.br/1',
    country: 'BR',
    price_amount: 450000,
    lat: -8.12,
    lng: -34.90,
    tags: [],
    commercial_type: 'ponto_comercial',
    property_type: null,
    city: 'Recife',
    state: 'PE',
    ...overrides,
  }
}

function makeInsight(overrides = {}) {
  return {
    id: 'insight-001',
    userId: 'user-001',
    city: 'Recife',
    state: 'PE',
    country: 'BR',
    avgIncome: 4500,
    populationDensity: 6000,
    confidenceScore: 85,
    nearbyBusinesses: [
      { name: 'Escola Municipal', category: 'school', distanceMeters: 200, source: 'google' },
      { name: 'Shopping Center', category: 'mall', distanceMeters: 350, source: 'google' },
      { name: 'Café do João', category: 'cafe', distanceMeters: 100, source: 'google' },
      { name: 'Padaria Nova', category: 'bakery', distanceMeters: 300, source: 'google' },
    ],
    dataSources: [],
    consumerProfile: 'Consumidor urbano classe média-alta',
    latitude: -8.12,
    longitude: -34.90,
    rawGeocode: {},
    rawDemographics: {},
    rawPlaces: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Test 1: scoreDemographics – high income produces high score + positive signal
// ---------------------------------------------------------------------------
test('scoreDemographics with high income returns high score and positive signal', () => {
  const insight = makeInsight({ avgIncome: 5500 })
  const profile = getStrategy('cafe')
  const result = scoreDemographics(insight, profile)

  assert.equal(result.category, 'demographics')
  assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`)
  assert.ok(result.weight > 0, 'Weight should be positive')
  assert.ok(result.signals.some((s) => s.impact === 'positive'), 'Should have a positive signal')
  assert.equal(result.risks.length, 0, 'No risks expected for high income')
})

// ---------------------------------------------------------------------------
// Test 2: scoreDemographics – null income returns penalty + risk flag
// ---------------------------------------------------------------------------
test('scoreDemographics with null income returns penalty score and risk flag', () => {
  const insight = makeInsight({ avgIncome: null })
  const profile = getStrategy('cafe')
  const result = scoreDemographics(insight, profile)

  // score = 40 base (null income) + 5 (density > 5000) = 45
  assert.ok(result.score <= 45, `Expected score <= 45, got ${result.score}`)
  assert.ok(result.risks.some((r) => r.label.toLowerCase().includes('renda')), 'Should have income risk flag')
})

// ---------------------------------------------------------------------------
// Test 3: scoreLocationQuality – high confidence returns high score
// ---------------------------------------------------------------------------
test('scoreLocationQuality with high confidence score returns high score', () => {
  const listing = makeListing()
  const insight = makeInsight({ confidenceScore: 90 })
  const profile = getStrategy('cafe')
  const result = scoreLocationQuality(listing, insight, profile)

  assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`)
  assert.ok(result.signals.some((s) => s.impact === 'positive'), 'Should have a positive signal')
})

// ---------------------------------------------------------------------------
// Test 4: scoreLocationQuality – null confidence returns risk flag
// ---------------------------------------------------------------------------
test('scoreLocationQuality with null confidence returns risk flag', () => {
  const listing = makeListing({ lat: null, lng: null })
  const insight = makeInsight({ confidenceScore: null, latitude: null, longitude: null })
  const profile = getStrategy('cafe')
  const result = scoreLocationQuality(listing, insight, profile)

  assert.ok(result.score <= 40, `Expected score <= 40, got ${result.score}`)
  assert.ok(result.risks.length > 0, 'Should have risk flags')
  assert.ok(result.risks.some((r) => r.severity === 'high'), 'Should have high severity risk')
})

// ---------------------------------------------------------------------------
// Test 5: scoreCompetition – 0 competitors returns 90
// ---------------------------------------------------------------------------
test('scoreCompetition with 0 competitors returns 90', () => {
  // nearbyBusinesses has no cafe/restaurant/bakery — only a school
  const insight = makeInsight({
    nearbyBusinesses: [
      { name: 'Escola Municipal', category: 'school', distanceMeters: 200, source: 'google' },
    ],
  })
  const profile = getStrategy('cafe')
  const result = scoreCompetition(insight, profile)

  assert.equal(result.score, 90)
  assert.ok(result.signals.some((s) => s.label.includes('500m')), 'Should signal no competitors in 500m')
})

// ---------------------------------------------------------------------------
// Test 6: scoreCompetition – 6+ competitors returns low score + high risk
// ---------------------------------------------------------------------------
test('scoreCompetition with 6+ competitors returns low score and high risk flag', () => {
  const competitors = Array.from({ length: 7 }, (_, i) => ({
    name: `Café ${i + 1}`,
    category: 'cafe',
    distanceMeters: 200,
    source: 'google',
  }))
  const insight = makeInsight({ nearbyBusinesses: competitors })
  const profile = getStrategy('cafe')
  const result = scoreCompetition(insight, profile)

  assert.ok(result.score <= 25, `Expected score <= 25, got ${result.score}`)
  assert.ok(result.risks.some((r) => r.severity === 'high'), 'Should have high severity risk')
})

// ---------------------------------------------------------------------------
// Test 7: scoreNearbyBusinesses – empty array returns 20 + risk
// ---------------------------------------------------------------------------
test('scoreNearbyBusinesses with empty array returns 20 and a risk flag', () => {
  const insight = makeInsight({ nearbyBusinesses: [] })
  const profile = getStrategy('retail')
  const result = scoreNearbyBusinesses(insight, profile)

  assert.equal(result.score, 20)
  assert.ok(result.risks.some((r) => r.label.includes('Sem dados')), 'Should flag missing business data')
})

// ---------------------------------------------------------------------------
// Test 8: computeScore with cafe profile returns SCORED outcome with valid shape
// ---------------------------------------------------------------------------
test('computeScore with cafe profile returns valid ScoreResult shape', () => {
  const listing = makeListing()
  const insight = makeInsight()
  const outcome = computeScore(listing, insight, 'cafe')

  assert.equal(outcome.status, 'SCORED', 'Should return SCORED status')
  const result = outcome.result
  assert.ok(typeof result.totalScore === 'number', 'totalScore should be number')
  assert.ok(result.totalScore >= 0 && result.totalScore <= 100, 'totalScore should be 0-100')
  assert.ok(Array.isArray(result.breakdown), 'breakdown should be array')
  assert.equal(result.breakdown.length, 6, 'Should have 6 category breakdowns')
  assert.ok(Array.isArray(result.signals), 'signals should be array')
  assert.ok(Array.isArray(result.risks), 'risks should be array')
  assert.ok(['forte', 'moderado', 'fraco'].includes(result.fitLabel), 'fitLabel should be valid')
  assert.equal(result.strategySlug, 'cafe')
  assert.ok(typeof result.computedAt === 'string', 'computedAt should be string')
})

// ---------------------------------------------------------------------------
// Test 9: cafe vs logistics produce meaningfully different scores
// ---------------------------------------------------------------------------
test('cafe and logistics profiles produce different total scores for the same input', () => {
  const listing = makeListing({ price_amount: 800000 })
  const insight = makeInsight({
    confidenceScore: 92,
    avgIncome: 3000,
    nearbyBusinesses: [
      { name: 'Terminal Portuário', category: 'port', distanceMeters: 300, source: 'google' },
      { name: 'Rodovia BR-101', category: 'highway', distanceMeters: 100, source: 'google' },
    ],
  })

  const cafeOutcome = computeScore(listing, insight, 'cafe')
  const logisticsOutcome = computeScore(listing, insight, 'logistics')

  assert.equal(cafeOutcome.status, 'SCORED')
  assert.equal(logisticsOutcome.status, 'SCORED')

  assert.notEqual(cafeOutcome.result.totalScore, logisticsOutcome.result.totalScore, 'Scores should differ')
  assert.ok(
    logisticsOutcome.result.totalScore > cafeOutcome.result.totalScore,
    `Logistics (${logisticsOutcome.result.totalScore}) should score higher than cafe (${cafeOutcome.result.totalScore}) for highway/port location`
  )
})

// ---------------------------------------------------------------------------
// Test 10: fitLabel thresholds
// ---------------------------------------------------------------------------
test('fitLabel is forte for high score and fraco for low score', () => {
  const forteInsight = makeInsight({
    avgIncome: 8000,
    confidenceScore: 95,
    populationDensity: 7000,
    nearbyBusinesses: [
      { name: 'Rodovia BR-101', category: 'highway', distanceMeters: 100, source: 'google' },
      { name: 'Centro de Distribuição', category: 'distribution', distanceMeters: 200, source: 'google' },
    ],
  })
  const forteListing = makeListing({ price_amount: 1500000, tags: ['leased'] })
  const forteOutcome = computeScore(forteListing, forteInsight, 'logistics')
  assert.equal(forteOutcome.status, 'SCORED')
  assert.equal(forteOutcome.result.fitLabel, 'forte', `Expected forte, got ${forteOutcome.result.fitLabel} (score: ${forteOutcome.result.totalScore})`)

  const fracoInsight = makeInsight({
    avgIncome: 600,
    confidenceScore: 15,
    latitude: null,
    longitude: null,
    populationDensity: 100,
    nearbyBusinesses: Array.from({ length: 8 }, (_, i) => ({
      name: `Café ${i}`,
      category: 'cafe',
      distanceMeters: 150,
      source: 'google',
    })),
  })
  const fracoListing = makeListing({ lat: null, lng: null, price_amount: null, tags: ['distressed'] })
  const fracoOutcome = computeScore(fracoListing, fracoInsight, 'cafe')
  assert.equal(fracoOutcome.status, 'SCORED')
  assert.equal(fracoOutcome.result.fitLabel, 'fraco', `Expected fraco, got ${fracoOutcome.result.fitLabel} (score: ${fracoOutcome.result.totalScore})`)
})

// ---------------------------------------------------------------------------
// Test 11: computeScore returns NEEDS_ENRICHMENT when insight is null
// ---------------------------------------------------------------------------
test('computeScore returns NEEDS_ENRICHMENT status when insight is null', () => {
  const listing = makeListing()
  const outcome = computeScore(listing, null, 'cafe')

  assert.equal(outcome.status, 'NEEDS_ENRICHMENT', 'Should return NEEDS_ENRICHMENT, not throw')
  assert.ok(
    outcome.message.includes('Enriqueça') || outcome.message.includes('localização'),
    `Message should be in Portuguese, got: ${outcome.message}`
  )
})

// ---------------------------------------------------------------------------
// Test 12: signals array is non-empty for a realistic full input
// ---------------------------------------------------------------------------
test('computeScore produces non-empty signals for a realistic input', () => {
  const listing = makeListing()
  const insight = makeInsight()
  const outcome = computeScore(listing, insight, 'cafe')

  assert.equal(outcome.status, 'SCORED')
  assert.ok(outcome.result.signals.length > 0, `Expected signals, got ${outcome.result.signals.length}`)
})

// ---------------------------------------------------------------------------
// Test 13: risks array is non-empty when confidence is low
// ---------------------------------------------------------------------------
test('computeScore produces risks when confidence is low', () => {
  const listing = makeListing({ lat: null, lng: null })
  const insight = makeInsight({ confidenceScore: 25, latitude: null, longitude: null })
  const outcome = computeScore(listing, insight, 'cafe')

  assert.equal(outcome.status, 'SCORED')
  assert.ok(outcome.result.risks.length > 0, `Expected risk flags, got ${outcome.result.risks.length}`)
  assert.ok(
    outcome.result.risks.some((r) => r.severity === 'high'),
    'Should have at least one high severity risk for low confidence'
  )
})

// ---------------------------------------------------------------------------
// Test 14: strategy weight sums
// ---------------------------------------------------------------------------
test('all strategy profiles have weights that sum to approximately 1.0', () => {
  for (const [slug, profile] of Object.entries(STRATEGIES)) {
    const sum = Object.values(profile.weights).reduce((a, b) => a + b, 0)
    assert.ok(
      Math.abs(sum - 1.0) < 0.01,
      `Strategy '${slug}' weights sum to ${sum.toFixed(4)}, expected ~1.0`
    )
  }
})

// ---------------------------------------------------------------------------
// Test 15: RuleBasedScoringEngine class interface
// ---------------------------------------------------------------------------
test('RuleBasedScoringEngine.computeScore returns same result as computeScore function', () => {
  const engine = new RuleBasedScoringEngine()
  const listing = makeListing()
  const insight = makeInsight()
  const profile = getStrategy('retail')

  const classOutcome = engine.computeScore(listing, insight, profile)
  const fnOutcome = computeScore(listing, insight, profile)

  assert.equal(classOutcome.status, 'SCORED')
  assert.equal(fnOutcome.status, 'SCORED')
  assert.equal(classOutcome.result.totalScore, fnOutcome.result.totalScore)
  assert.equal(classOutcome.result.fitLabel, fnOutcome.result.fitLabel)
  assert.equal(classOutcome.result.strategySlug, fnOutcome.result.strategySlug)
})
