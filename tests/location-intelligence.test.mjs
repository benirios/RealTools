import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  deriveConsumerProfile,
  geocodeLocation,
  getDemographicEstimate,
  getNearbyBusinesses,
  resolveLocationIntelligence,
} = require('../lib/location-intelligence/providers.js')
const { toLocationInsightInsert } = require('../lib/location-intelligence/insights.js')
const { createDemoLocationInsightsForListing } = require('../lib/location-intelligence/demo-seeds.js')
const {
  buildListingLocationInput,
  resolveStandaloneLocationInsight,
  createStandaloneLocationInsight,
  enrichListingLocationInsight,
  getListingLocationInsightByListingId,
  getLocationInsightById,
  normalizeCreateLocationInsightInput,
} = require('../lib/location-intelligence/api.js')

test('coordinate passthrough skips provider lookup', async () => {
  const result = await geocodeLocation({
    latitude: -8.1285,
    longitude: -34.9033,
    city: 'Recife',
    state: 'PE',
  })

  assert.equal(result.provider, 'passthrough')
  assert.equal(result.latitude, -8.1285)
  assert.equal(result.longitude, -34.9033)
  assert.equal(result.confidence, 100)
})

test('address geocoding falls back to mock recognition', async () => {
  const result = await geocodeLocation({
    address: 'Boa Viagem',
    city: 'Recife',
    state: 'PE',
  })

  assert.equal(result.provider, 'mock')
  assert.equal(result.city, 'Recife')
  assert.equal(result.state, 'PE')
  assert.ok(result.latitude !== null)
  assert.ok(result.longitude !== null)
})

test('nominatim geocoding resolves direct address search', async () => {
  const result = await geocodeLocation(
    {
      address: 'Av. Boa Viagem, 100',
      city: 'Recife',
      state: 'PE',
      country: 'BR',
    },
    {
      fetchImpl: async (url) => {
        assert.match(String(url), /nominatim/i)
        return {
          ok: true,
          json: async () => [
            {
              lat: '-8.128500',
              lon: '-34.903300',
              display_name: 'Av. Boa Viagem, Recife - PE, Brasil',
              address: {
                suburb: 'Boa Viagem',
                city: 'Recife',
                state: 'Pernambuco',
              },
            },
          ],
        }
      },
    }
  )

  assert.equal(result.provider, 'nominatim')
  assert.equal(result.city, 'Recife')
  assert.equal(result.state, 'Pernambuco')
  assert.equal(result.latitude, -8.1285)
  assert.equal(result.longitude, -34.9033)
})

test('provider timeout falls back cleanly', async () => {
  const result = await geocodeLocation(
    {
      address: 'Rua test',
      city: 'Cidade',
      state: 'ST',
    },
    {
      googleMapsApiKey: 'demo-key',
      fetchImpl: (_url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
      timeoutMs: 5,
    }
  )

  assert.equal(result.provider, 'mock')
  assert.equal(result.latitude, null)
  assert.equal(result.longitude, null)
  assert.ok(result.warnings.length > 0)
})

test('sidra demographics resolve through ibge localities and sidra tables', async () => {
  const result = await getDemographicEstimate(
    {
      city: 'Recife',
      state: 'PE',
    },
    {
      fetchImpl: async (url) => {
        const target = String(url)

        if (target.includes('/localidades/estados/PE/municipios')) {
          return {
            ok: true,
            json: async () => [
              { id: 2607901, nome: 'Recife' },
            ],
          }
        }

        if (target.includes('/values/t/4714/')) {
          return {
            ok: true,
            json: async () => [
              { D1N: 'Densidade demográfica', V: '7200' },
              { D1N: 'População residente', V: '1679000' },
            ],
          }
        }

        if (target.includes('/values/t/10295/')) {
          return {
            ok: true,
            json: async () => [
              { D1N: 'Rendimento médio mensal per capita', V: '3450' },
            ],
          }
        }

        throw new Error(`Unexpected URL: ${target}`)
      },
    }
  )

  assert.equal(result.provider, 'sidra')
  assert.equal(result.populationDensity, 7200)
  assert.equal(result.avgIncome, 3450)
  assert.ok(result.sourceNotes.some((note) => note.includes('Recife')))
})

test('demographic fallback returns mock values', async () => {
  const result = await getDemographicEstimate({
    city: 'Curitiba',
    state: 'PR',
  })

  assert.equal(result.provider, 'mock')
  assert.ok(result.avgIncome !== null)
  assert.ok(result.populationDensity !== null)
  assert.ok(result.sourceNotes.length > 0)
})

test('nearby business fallback returns unavailable instead of fake businesses', async () => {
  const result = await getNearbyBusinesses({
    city: 'Recife',
    state: 'PE',
  })

  assert.equal(result.provider, 'unavailable')
  assert.equal(result.businesses.length, 0)
  assert.equal(result.confidence, 0)
  assert.ok(result.warnings.some((warning) => warning.includes('unavailable')))
})

test('consumer profile combines income density and nearby business mix', () => {
  const profile = deriveConsumerProfile({
    avgIncome: 8600,
    populationDensity: 7200,
    nearbyBusinesses: [
      { name: 'Banco', category: 'bank', source: 'mock' },
      { name: 'Academia', category: 'gym', source: 'mock' },
    ],
  })

  assert.match(profile, /renda mais alta/i)
  assert.match(profile, /Alta densidade/i)
})

test('confidence is reduced for fallback-only enrichment', async () => {
  const result = await resolveLocationIntelligence({
    address: 'Lugar sem referência',
    city: 'Cidade',
    state: 'ST',
  })

  assert.ok(result.confidenceScore <= 55)
  assert.equal(result.providers.geocode, 'mock')
  assert.equal(result.providers.demographics, 'mock')
  assert.equal(result.providers.places, 'unavailable')
  assert.equal(result.nearbyBusinesses.length, 0)
})

test('insert mapping preserves structured enrichment fields', () => {
  const insert = toLocationInsightInsert('user-1', {
    listingId: null,
    address: 'Rua A',
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    state: 'PE',
    country: 'BR',
    latitude: -8.1,
    longitude: -34.9,
    avgIncome: 7000,
    populationDensity: 6000,
    consumerProfile: 'Perfil local',
    nearbyBusinesses: [
      { name: 'Farmácia', category: 'pharmacy', source: 'mock' },
    ],
    dataSources: [
      { segment: 'geocode', provider: 'mock', note: 'ok', fallback: true },
    ],
    confidenceScore: 62,
    rawGeocode: { source: 'mock' },
    rawDemographics: { source: 'mock' },
    rawPlaces: { source: 'mock' },
  })

  assert.equal(insert.user_id, 'user-1')
  assert.equal(insert.listing_id, null)
  assert.equal(insert.city, 'Recife')
  assert.equal(insert.state, 'PE')
  assert.equal(insert.confidence_score, 62)
  assert.equal(Array.isArray(insert.nearby_businesses), true)
  assert.equal(insert.nearby_businesses.length, 0)
})

test('demo seed creation saves standalone and linked insights', async () => {
  const writes = []
  const userId = '11111111-1111-4111-8111-111111111111'
  const listingId = '22222222-2222-4222-8222-222222222222'
  let insertCount = 0
  let upsertCount = 0
  const supabase = {
    from(table) {
      return {
        insert(payload) {
          writes.push({ table, payload, mode: 'insert' })
          insertCount += 1
          return {
            select() {
              return {
                single: async () => ({
                  data: {
                    ...payload,
                    id: insertCount === 1
                      ? '33333333-3333-4333-8333-333333333333'
                      : '33333333-3333-4333-8333-333333333334',
                    created_at: '2026-05-03T00:00:00Z',
                    updated_at: '2026-05-03T00:00:00Z',
                  },
                  error: null,
                }),
              }
            },
          }
        },
        upsert(payload) {
          writes.push({ table, payload, mode: 'upsert' })
          upsertCount += 1
          return {
            select() {
              return {
                single: async () => ({
                  data: {
                    ...payload,
                    id: upsertCount === 1
                      ? '44444444-4444-4444-8444-444444444444'
                      : '44444444-4444-4444-8444-444444444445',
                    created_at: '2026-05-03T00:00:00Z',
                    updated_at: '2026-05-03T00:00:00Z',
                  },
                  error: null,
                }),
              }
            },
          }
        },
      }
    },
  }

  const result = await createDemoLocationInsightsForListing(supabase, userId, {
    id: listingId,
    user_id: userId,
    source: 'olx',
    source_url: 'https://example.com/listing',
    title: 'Loja em Boa Viagem',
    description: null,
    price_text: null,
    price_amount: null,
    location_text: 'Boa Viagem, Recife',
    address_text: 'Av. Boa Viagem',
    country: 'BR',
    state: 'PE',
    city: 'Recife',
    neighborhood: 'Boa Viagem',
    lat: null,
    lng: null,
    images: [],
    is_commercial: true,
    commercial_type: 'loja',
    confidence: 92,
    reasoning: null,
    raw_payload: {},
    first_seen_at: null,
    last_seen_at: null,
    created_at: null,
    updated_at: null,
  })

  assert.equal(result.ok, true)
  assert.equal(writes.length, 2)
  assert.equal(writes[0].payload.listing_id, null)
  assert.equal(writes[1].payload.listing_id, listingId)
})

test('listing input builder preserves persisted context', () => {
  const input = buildListingLocationInput({
    id: '11111111-1111-4111-8111-111111111111',
    user_id: '22222222-2222-4222-8222-222222222222',
    source: 'olx',
    source_url: 'https://example.com/listing',
    title: 'Loja comercial',
    description: null,
    price_text: null,
    price_amount: null,
    location_text: 'Boa Viagem, Recife',
    address_text: 'Av. Boa Viagem, 100',
    country: 'BR',
    state: 'PE',
    city: 'Recife',
    neighborhood: 'Boa Viagem',
    lat: -8.12,
    lng: -34.9,
    images: [],
    is_commercial: true,
    commercial_type: 'loja',
    confidence: 88,
    reasoning: null,
    raw_payload: {},
    first_seen_at: null,
    last_seen_at: null,
    created_at: null,
    updated_at: null,
  })

  assert.equal(input.listingId, '11111111-1111-4111-8111-111111111111')
  assert.equal(input.city, 'Recife')
  assert.equal(input.latitude, -8.12)
})

test('create and read helpers keep user scope and stable shape', async () => {
  const inserts = []
  const rows = {
    insight_1: {
      id: '55555555-5555-4555-8555-555555555555',
      user_id: '22222222-2222-4222-8222-222222222222',
      listing_id: null,
      address: 'Av. Boa Viagem',
      neighborhood: 'Boa Viagem',
      city: 'Recife',
      state: 'PE',
      country: 'BR',
      latitude: -8.12,
      longitude: -34.9,
      avg_income: 8600,
      population_density: 7200,
      consumer_profile: 'Perfil local',
      nearby_businesses: [],
      data_sources: [],
      confidence_score: 90,
      raw_geocode: {},
      raw_demographics: {},
      raw_places: {},
      created_at: '2026-05-03T00:00:00Z',
      updated_at: '2026-05-03T00:00:00Z',
    },
  }

  const supabase = {
    from(table) {
      return {
        select() {
          const chain = {
            eq() {
              return chain
            },
            order() {
              return chain
            },
            limit() {
              return chain
            },
            maybeSingle: async () => ({ data: rows.insight_1, error: null }),
            single: async () => ({ data: rows.insight_1, error: null }),
          }

          return chain
        },
        insert(payload) {
          inserts.push({ table, payload, mode: 'insert' })
          return {
            select() {
              return {
                single: async () => ({ data: { ...rows.insight_1, ...payload, id: rows.insight_1.id }, error: null }),
              }
            },
          }
        },
        upsert(payload) {
          inserts.push({ table, payload, mode: 'upsert' })
          return {
            select() {
              return {
                single: async () => ({ data: { ...rows.insight_1, ...payload, id: rows.insight_1.id }, error: null }),
              }
            },
          }
        },
      }
    },
  }

  const parsed = await normalizeCreateLocationInsightInput({
    address: 'Av. Boa Viagem',
    city: 'Recife',
    state: 'PE',
    latitude: -8.12,
    longitude: -34.9,
  })
  assert.ok(parsed.data)

  const created = await createStandaloneLocationInsight(supabase, '11111111-1111-4111-8111-111111111111', parsed.data)
  assert.equal(created.error, null)
  assert.equal(created.data?.city, 'Recife')
  assert.equal(inserts[0].table, 'location_insights')
  assert.equal(inserts[0].payload.user_id, '11111111-1111-4111-8111-111111111111')

  const readById = await getLocationInsightById(supabase, '11111111-1111-4111-8111-111111111111', rows.insight_1.id)
  assert.equal(readById?.id, rows.insight_1.id)
  assert.equal(readById?.city, 'Recife')

  const readByListing = await getListingLocationInsightByListingId(supabase, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111')
  assert.equal(readByListing?.id, rows.insight_1.id)
})

test('resolve standalone insight returns a valid payload without persistence', async () => {
  const insight = await resolveStandaloneLocationInsight({
    address: 'Av. Boa Viagem, 100',
    city: 'Recife',
    state: 'PE',
    country: 'BR',
  })

  assert.equal(typeof insight.id, 'string')
  assert.equal(insight.city, 'Recife')
  assert.equal(insight.state, 'PE')
  assert.equal(Array.isArray(insight.dataSources), true)
  assert.ok(insight.createdAt.length > 0)
})

test('enrich helper loads user-owned listing and upserts linked insight', async () => {
  const writes = []
  const supabase = {
    from(table) {
      if (table === 'listings') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({
                        data: {
                          id: '33333333-3333-4333-8333-333333333333',
                          user_id: '44444444-4444-4444-8444-444444444444',
                          source: 'olx',
                          source_url: 'https://example.com/listing-2',
                          title: 'Sala comercial',
                          description: null,
                          price_text: null,
                          price_amount: null,
                          location_text: 'Centro',
                          address_text: 'Rua do Centro',
                          country: 'BR',
                          state: 'PE',
                          city: 'Recife',
                          neighborhood: 'Centro',
                          lat: -8.0476,
                          lng: -34.877,
                          images: [],
                          is_commercial: true,
                          commercial_type: 'sala',
                          confidence: 84,
                          reasoning: null,
                          raw_payload: {},
                          first_seen_at: null,
                          last_seen_at: null,
                          created_at: null,
                          updated_at: null,
                        },
                        error: null,
                      }),
                    }
                  },
                }
              },
            }
          },
        }
      }

      return {
        upsert(payload) {
          writes.push({ table, payload, mode: 'upsert' })
          return {
            select() {
              return {
                single: async () => ({
                  data: {
                    id: '66666666-6666-4666-8666-666666666666',
                    user_id: payload.user_id,
                    listing_id: payload.listing_id,
                    address: payload.address,
                    neighborhood: payload.neighborhood,
                    city: payload.city,
                    state: payload.state,
                    country: payload.country,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    avg_income: payload.avg_income,
                    population_density: payload.population_density,
                    consumer_profile: payload.consumer_profile,
                    nearby_businesses: payload.nearby_businesses,
                    data_sources: payload.data_sources,
                    confidence_score: payload.confidence_score,
                    raw_geocode: payload.raw_geocode,
                    raw_demographics: payload.raw_demographics,
                    raw_places: payload.raw_places,
                    created_at: '2026-05-03T00:00:00Z',
                    updated_at: '2026-05-03T00:00:00Z',
                  },
                  error: null,
                }),
              }
            },
          }
        },
      }
    },
  }

  const result = await enrichListingLocationInsight(supabase, '44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333')
  assert.equal(result.error, null)
  assert.equal(result.data?.listingId, '33333333-3333-4333-8333-333333333333')
  assert.equal(writes[0].payload.user_id, '44444444-4444-4444-8444-444444444444')
  assert.equal(writes[0].payload.listing_id, '33333333-3333-4333-8333-333333333333')
  assert.equal(result.data?.city, 'Recife')
})
