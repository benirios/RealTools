import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// ---------------------------------------------------------------------------
// Module imports — wrapped in try/catch so the file loads before Wave 1 creates
// lib/scoring/data.js and lib/scoring/service.js
// ---------------------------------------------------------------------------

let upsertScore, getScoreHistory, getScore
let scoreListingService

try {
  ;({ upsertScore, getScoreHistory, getScore } = require('../lib/scoring/data.js'))
} catch {
  // Wave 1 will create lib/scoring/data.js
}
try {
  ;({ scoreListingService } = require('../lib/scoring/service.js'))
} catch {
  // Wave 1 will create lib/scoring/service.js
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeListing(overrides = {}) {
  return {
    id: 'listing-001', user_id: 'user-001', title: 'Ponto Comercial',
    source: 'olx', source_url: 'https://olx.com.br/1', country: 'BR',
    price_amount: 450000, lat: -8.12, lng: -34.90, tags: [],
    commercial_type: 'ponto_comercial', property_type: null,
    city: 'Recife', state: 'PE',
    ...overrides,
  }
}

function makeInsight(overrides = {}) {
  return {
    id: 'insight-001', userId: 'user-001', city: 'Recife', state: 'PE', country: 'BR',
    avgIncome: 4500, populationDensity: 6000, confidenceScore: 85,
    nearbyBusinesses: [
      { name: 'Escola', category: 'school', distanceMeters: 200, source: 'google' },
      { name: 'Shopping', category: 'mall', distanceMeters: 350, source: 'google' },
    ],
    dataSources: [], consumerProfile: null, latitude: -8.12, longitude: -34.90,
    rawGeocode: {}, rawDemographics: {}, rawPlaces: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeScoreRow(overrides = {}) {
  return {
    id: 'score-001', user_id: 'user-001', listing_id: 'listing-001',
    strategy_slug: 'cafe', total_score: 72, score_version: 1,
    breakdown: [], signals: [], risks: [], fit_label: 'forte',
    computed_at: new Date().toISOString(),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    demographics_score: 65, location_score: 70, foot_traffic_score: 62,
    competition_score: 68, risk_score: 75, investor_fit_score: 70,
    engine_version: '1.0',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Mock builders
// ---------------------------------------------------------------------------

// Mock for upsertScore calls — handles TWO sequential calls to opportunity_scores:
//   Call 1: select('score_version').eq().eq().eq().maybeSingle() — returns existingScoreVersion
//   Call 2: upsert(payload).select('*').single() — returns savedRow
function makeSupabaseMockForUpsert(existingScoreVersion = null, savedRow = null) {
  let callCount = 0
  return {
    from(table) {
      if (table === 'opportunity_scores') {
        callCount++
        if (callCount === 1) {
          // First call: read score_version
          return {
            select(_cols) {
              const chain = {
                eq(_k, _v) { return chain },
                maybeSingle: async () => ({
                  data: existingScoreVersion !== null ? { score_version: existingScoreVersion } : null,
                  error: null,
                }),
              }
              return chain
            },
          }
        }
        // Second call: upsert write
        return {
          upsert(payload) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: { ...(savedRow ?? makeScoreRow()), ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }
      return {}
    },
  }
}

// Mock for getScoreHistory — chains: select().eq().eq()[.eq()].order()
function makeSupabaseMockForHistory(rows) {
  return {
    from(table) {
      if (table === 'opportunity_scores') {
        const chain = {
          select() { return chain },
          eq() { return chain },
          order: async () => ({ data: rows, error: null }),
        }
        return chain
      }
      return {}
    },
  }
}

// Mock for scoreListingService — handles listings, location_insights, and opportunity_scores
// The opportunity_scores from() must serve BOTH:
//   - select().eq().eq().eq().maybeSingle() (read score_version in upsertScore)
//   - upsert().select().single() (write in upsertScore)
function makeServiceMock({ listingRow, insightRow, scoreVersion = null }) {
  let opportunityCallCount = 0
  return {
    from(table) {
      if (table === 'listings') {
        const c = {
          select() { return c },
          eq() { return c },
          maybeSingle: async () => ({ data: listingRow, error: null }),
        }
        return c
      }
      if (table === 'location_insights') {
        const c = {
          select() { return c },
          eq() { return c },
          order() { return c },
          limit() { return c },
          maybeSingle: async () => ({ data: insightRow, error: null }),
        }
        return c
      }
      if (table === 'opportunity_scores') {
        opportunityCallCount++
        if (opportunityCallCount % 2 === 1) {
          // Odd calls: read score_version (first call per scoreListingService invocation)
          const chain = {
            select() { return chain },
            eq() { return chain },
            maybeSingle: async () => ({
              data: scoreVersion !== null ? { score_version: scoreVersion } : null,
              error: null,
            }),
          }
          return chain
        }
        // Even calls: upsert write
        return {
          select() { return this },
          eq() { return this },
          upsert(payload) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: { ...makeScoreRow(), ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }
      return {}
    },
  }
}

// ---------------------------------------------------------------------------
// Smoke test — verifies the test harness itself loads without error
// ---------------------------------------------------------------------------

test('scoring-service test file loads', () => {
  assert.ok(true, 'test harness initialised')
})

// ---------------------------------------------------------------------------
// D-10 test cases — filled in by Wave 4 (Plan 06)
// ---------------------------------------------------------------------------

test('SCO-18 save/fetch round-trip: upsertScore then getScoreHistory returns the saved row', async () => {
  const scoreRow = makeScoreRow({ score_version: 1, total_score: 72, strategy_slug: 'cafe' })

  // upsertScore: no existing row (existingScoreVersion = null), save returns scoreRow
  const upsertSupabase = makeSupabaseMockForUpsert(null, scoreRow)

  const fakeResult = {
    totalScore: 72, strategySlug: 'cafe', fitLabel: 'forte',
    breakdown: [
      { category: 'demographics', score: 65 },
      { category: 'location_quality', score: 70 },
      { category: 'nearby_businesses', score: 62 },
      { category: 'competition', score: 68 },
      { category: 'risk', score: 75 },
      { category: 'investor_fit', score: 70 },
    ],
    signals: [], risks: [], computedAt: new Date().toISOString(),
  }

  const upsertResult = await upsertScore(upsertSupabase, 'user-001', 'listing-001', fakeResult)
  assert.equal(upsertResult.error, null, 'upsertScore should succeed without error')
  assert.ok(upsertResult.data, 'upsertScore should return saved data')
  assert.equal(upsertResult.data.score_version, 1, 'saved row should have score_version = 0+1 = 1')

  // getScoreHistory: returns array with the saved row
  const historySupabase = makeSupabaseMockForHistory([scoreRow])
  const history = await getScoreHistory(historySupabase, 'user-001', 'listing-001')
  assert.ok(Array.isArray(history), 'getScoreHistory should return an array')
  assert.equal(history.length, 1, 'history should contain 1 row')
  assert.equal(history[0].strategy_slug, 'cafe', 'returned row should be for cafe strategy')
  assert.equal(history[0].total_score, 72, 'returned row should have correct total_score')
})

test('SCO-18 missing location_insights: scoreListingService returns Portuguese error in errors.general', async () => {
  // insightRow = null simulates no location_insights row for this listing
  const supabase = makeServiceMock({ listingRow: makeListing(), insightRow: null })
  const result = await scoreListingService(supabase, 'user-001', 'listing-001', 'cafe')

  assert.ok(result.errors, 'result should have an errors object')
  assert.ok(Array.isArray(result.errors.general), 'errors.general should be an array')
  assert.ok(
    result.errors.general[0].includes('Enriqueça'),
    `error should contain Portuguese enrichment message, got: "${result.errors.general[0]}"`
  )
})

test('SCO-11/SCO-20 recompute increments score_version: upsertScore reads existing version and increments by 1', async () => {
  let capturedPayload = null

  const supabase = {
    from(table) {
      if (table === 'opportunity_scores') {
        return {
          select(_cols) {
            // Read call: returns existing score_version = 3
            const chain = {
              eq(_k, _v) { return chain },
              maybeSingle: async () => ({ data: { score_version: 3 }, error: null }),
            }
            return chain
          },
          upsert(payload) {
            capturedPayload = payload
            return {
              select() {
                return {
                  single: async () => ({
                    data: { ...makeScoreRow(), ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }
      return {}
    },
  }

  const fakeResult = {
    totalScore: 75, strategySlug: 'cafe', fitLabel: 'forte',
    breakdown: [], signals: [], risks: [], computedAt: new Date().toISOString(),
  }

  await upsertScore(supabase, 'user-001', 'listing-001', fakeResult)

  assert.ok(capturedPayload !== null, 'upsert should have been called with a payload')
  assert.equal(capturedPayload.score_version, 4, 'score_version should be 3+1=4')
})

test('SCO-19 getBestFitAction: cafe scores higher than logistics when nearbyBusinesses favor cafe', async () => {
  // Insight optimized for cafe: schools, malls, offices — high foot traffic generators
  const cafeInsight = makeInsight({
    avgIncome: 5000, confidenceScore: 90, populationDensity: 8000,
    nearbyBusinesses: [
      { name: 'Escola', category: 'school', distanceMeters: 100, source: 'google' },
      { name: 'Shopping', category: 'mall', distanceMeters: 200, source: 'google' },
      { name: 'Escritório', category: 'office', distanceMeters: 150, source: 'google' },
      { name: 'Universidade', category: 'university', distanceMeters: 300, source: 'google' },
    ],
  })

  // Use independent mocks for each strategy call to avoid call-count interference
  const cafeSupabase = makeServiceMock({ listingRow: makeListing(), insightRow: cafeInsight })
  const logisticsSupabase = makeServiceMock({ listingRow: makeListing(), insightRow: cafeInsight })

  const cafeResult = await scoreListingService(cafeSupabase, 'user-001', 'listing-001', 'cafe')
  const logisticsResult = await scoreListingService(logisticsSupabase, 'user-001', 'listing-001', 'logistics')

  assert.ok(cafeResult.score, `cafe scoring should succeed, got errors: ${JSON.stringify(cafeResult.errors)}`)
  assert.ok(logisticsResult.score, `logistics scoring should succeed, got errors: ${JSON.stringify(logisticsResult.errors)}`)
  assert.ok(
    cafeResult.score.totalScore > logisticsResult.score.totalScore,
    `cafe (${cafeResult.score.totalScore}) should score higher than logistics (${logisticsResult.score.totalScore}) on cafe-optimized data`
  )
})

test('SCO-10/SCO-20 getScoreHistory returns current row for listing (all strategy variants)', async () => {
  const rows = [
    makeScoreRow({ strategy_slug: 'cafe', total_score: 72 }),
    makeScoreRow({ strategy_slug: 'logistics', total_score: 55 }),
    makeScoreRow({ strategy_slug: 'pharmacy', total_score: 61 }),
  ]

  const supabase = makeSupabaseMockForHistory(rows)
  const history = await getScoreHistory(supabase, 'user-001', 'listing-001')

  assert.ok(Array.isArray(history), 'getScoreHistory should return an array')
  assert.equal(history.length, 3, 'should return all 3 strategy variant rows')
  assert.equal(history[0].strategy_slug, 'cafe', 'first row should be cafe (highest score)')
  assert.equal(history[1].strategy_slug, 'logistics', 'second row should be logistics')
  assert.equal(history[2].strategy_slug, 'pharmacy', 'third row should be pharmacy')
})
