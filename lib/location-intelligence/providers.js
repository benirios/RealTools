/* eslint-disable @typescript-eslint/no-require-imports */
const {
  buildBrazilLocationQuery,
  clampConfidence,
  compactLocationText,
  normalizeLocationText,
} = require('./normalization.js')

const DEFAULT_TIMEOUT_MS = 4000
const DEFAULT_NOMINATIM_USER_AGENT = 'RealTools/1.5'
const DEFAULT_NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const DEFAULT_IBGE_LOCALITIES_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'
const DEFAULT_SIDRA_BASE_URL = 'https://apisidra.ibge.gov.br/values'
const SIDRA_POPULATION_DENSITY_TABLE = 4714
const SIDRA_INCOME_TABLE = 10295

const DEMO_GEO_LOOKUPS = [
  {
    terms: ['boa viagem, recife, pe', 'boa viagem recife pe', 'boa viagem'],
    latitude: -8.1285,
    longitude: -34.9033,
    city: 'Recife',
    state: 'PE',
    neighborhood: 'Boa Viagem',
    confidence: 70,
  },
  {
    terms: ['recife, pe', 'recife pe', 'recife'],
    latitude: -8.0476,
    longitude: -34.8770,
    city: 'Recife',
    state: 'PE',
    neighborhood: null,
    confidence: 65,
  },
  {
    terms: ['olinda, pe', 'olinda pe', 'olinda'],
    latitude: -8.0102,
    longitude: -34.8544,
    city: 'Olinda',
    state: 'PE',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['sao paulo, sp', 'sao paulo sp', 'sao paulo'],
    latitude: -23.5505,
    longitude: -46.6333,
    city: 'São Paulo',
    state: 'SP',
    neighborhood: null,
    confidence: 66,
  },
  {
    terms: ['rio de janeiro, rj', 'rio de janeiro rj', 'rio de janeiro'],
    latitude: -22.9068,
    longitude: -43.1729,
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhood: null,
    confidence: 66,
  },
  {
    terms: ['salvador, ba', 'salvador ba', 'salvador'],
    latitude: -12.9777,
    longitude: -38.5016,
    city: 'Salvador',
    state: 'BA',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['fortaleza, ce', 'fortaleza ce', 'fortaleza'],
    latitude: -3.7319,
    longitude: -38.5267,
    city: 'Fortaleza',
    state: 'CE',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['belo horizonte, mg', 'belo horizonte mg', 'belo horizonte'],
    latitude: -19.9167,
    longitude: -43.9345,
    city: 'Belo Horizonte',
    state: 'MG',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['brasilia, df', 'brasília, df', 'brasilia df', 'brasília df', 'brasilia'],
    latitude: -15.7939,
    longitude: -47.8828,
    city: 'Brasília',
    state: 'DF',
    neighborhood: null,
    confidence: 64,
  },
]

function safeText(value) {
  return String(value ?? '').trim()
}

function normalizeLooseText(value) {
  return safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function geoDistanceMeters(origin, destination) {
  if (!origin || !destination) return null
  const toRadians = (deg) => (deg * Math.PI) / 180
  const earthRadius = 6371000
  const deltaLat = toRadians(destination.lat - origin.lat)
  const deltaLng = toRadians(destination.lng - origin.lng)
  const lat1 = toRadians(origin.lat)
  const lat2 = toRadians(destination.lat)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.sin(deltaLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return Math.round(2 * earthRadius * Math.asin(Math.sqrt(a)))
}

function toCoordinateNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isValidCoordinatePair(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function locateDemoGeocode(query) {
  const normalizedQuery = normalizeLocationText(query)
  if (!normalizedQuery) return null

  return DEMO_GEO_LOOKUPS.find((entry) =>
    entry.terms.some((term) => normalizedQuery.includes(term))
  ) ?? null
}

function parseGoogleGeocodeResult(result) {
  const geometry = result?.geometry?.location
  const components = Array.isArray(result?.address_components) ? result.address_components : []
  const pickComponent = (types) =>
    components.find((component) => types.some((type) => Array.isArray(component.types) && component.types.includes(type)))

  const neighborhood =
    pickComponent(['sublocality_level_1', 'neighborhood'])?.long_name ?? null
  const city =
    pickComponent(['administrative_area_level_2', 'locality', 'postal_town'])?.long_name ?? null
  const state =
    pickComponent(['administrative_area_level_1'])?.short_name ??
    pickComponent(['administrative_area_level_1'])?.long_name ??
    null

  return {
    latitude: toCoordinateNumber(geometry?.lat),
    longitude: toCoordinateNumber(geometry?.lng),
    address: safeText(result?.formatted_address) || null,
    neighborhood,
    city,
    state,
  }
}

function parseNominatimGeocodeResult(result) {
  const address = result?.address ?? {}
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    null
  const state = address.state ?? address.region ?? address.province ?? null
  const neighborhood = address.neighbourhood ?? address.suburb ?? null

  return {
    latitude: toCoordinateNumber(result?.lat),
    longitude: toCoordinateNumber(result?.lon),
    address: safeText(result?.display_name) || null,
    neighborhood,
    city,
    state,
  }
}

async function fetchJsonWithTimeout(url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const fetchImpl = init.fetch ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch implementation is not available.')
  }

  const requestInit = { ...init }
  delete requestInit.fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(url, {
      ...requestInit,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Provider request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }

    throw error instanceof Error ? error : new Error('Unknown provider request error')
  } finally {
    clearTimeout(timer)
  }
}

function buildNominatimSearchUrl(input = {}, baseUrl = DEFAULT_NOMINATIM_BASE_URL) {
  const query = buildBrazilLocationQuery(input)
  if (!query) return null

  const url = new URL('/search', baseUrl)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('accept-language', 'pt-BR')
  url.searchParams.set('q', query)
  return url.toString()
}

function buildSidraUrl(table, municipalityId, baseUrl = DEFAULT_SIDRA_BASE_URL) {
  const url = new URL(`${baseUrl}/t/${table}/n6/${encodeURIComponent(String(municipalityId))}/p/last/v/allxp/f/n/h/n`)
  url.searchParams.set('formato', 'json')
  return url.toString()
}

function extractSidraValue(rows = [], matcher = () => true) {
  const row = rows.find((entry) => {
    const haystack = Object.values(entry ?? {})
      .filter((value) => typeof value === 'string')
      .map((value) => normalizeLooseText(value))
      .join(' ')
    return matcher(haystack)
  })

  if (!row) return null

  const parsed = Number(String(row.V ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

async function fetchMunicipalitiesForState(state, options = {}) {
  const uf = safeText(state).toUpperCase()
  if (!uf) return []

  const baseUrl = options.ibgeLocalitiesBaseUrl ?? DEFAULT_IBGE_LOCALITIES_BASE_URL
  const url = `${baseUrl}/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`
  const response = await fetchJsonWithTimeout(
    url,
    {
      fetch: options.fetchImpl,
      headers: options.headers,
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  )

  return Array.isArray(response) ? response : []
}

function pickMunicipality(municipalities, city) {
  const target = normalizeLooseText(city)
  if (!target) return null

  const exactMatch = municipalities.find((municipality) => normalizeLooseText(municipality?.nome) === target)
  if (exactMatch) return exactMatch

  return municipalities.find((municipality) => {
    const normalized = normalizeLooseText(municipality?.nome)
    return normalized.includes(target) || target.includes(normalized)
  }) ?? null
}

async function fetchSidraRows(table, municipalityId, options = {}) {
  const baseUrl = options.sidraBaseUrl ?? DEFAULT_SIDRA_BASE_URL
  const url = buildSidraUrl(table, municipalityId, baseUrl)
  const response = await fetchJsonWithTimeout(
    url,
    {
      fetch: options.fetchImpl,
      headers: options.headers,
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  )

  return Array.isArray(response) ? response : []
}

async function getNominatimGeocodeResult(input = {}, options = {}) {
  const baseUrl = options.nominatimBaseUrl ?? DEFAULT_NOMINATIM_BASE_URL
  const userAgent = options.nominatimUserAgent ?? process.env.NOMINATIM_USER_AGENT ?? DEFAULT_NOMINATIM_USER_AGENT
  const searchUrl = buildNominatimSearchUrl(input, baseUrl)
  if (!searchUrl) return null

  const response = await fetchJsonWithTimeout(
    searchUrl,
    {
      fetch: options.fetchImpl,
      headers: {
        'User-Agent': userAgent,
        ...(options.headers ?? {}),
      },
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  )

  const parsed = Array.isArray(response) && response.length > 0
    ? parseNominatimGeocodeResult(response[0])
    : null

  if (parsed?.latitude === null || parsed?.longitude === null) {
    return null
  }

  return {
    ...parsed,
    provider: 'nominatim',
    confidence: 90,
    raw: response,
    warnings: [],
    dataSources: [
      {
        segment: 'geocode',
        provider: 'nominatim',
        note: 'Nominatim resolved the address.',
        fallback: false,
        confidence: 90,
      },
    ],
  }
}

async function geocodeLocation(input = {}, options = {}) {
  const latitude = toCoordinateNumber(input.latitude)
  const longitude = toCoordinateNumber(input.longitude)

  if (isValidCoordinatePair(latitude, longitude)) {
    return {
      latitude,
      longitude,
      address: compactLocationText(input.address, input.neighborhood, input.city, input.state) || null,
      neighborhood: safeText(input.neighborhood) || null,
      city: safeText(input.city) || null,
      state: safeText(input.state) || null,
      provider: 'passthrough',
      confidence: 100,
      raw: { source: 'input_coordinates' },
      warnings: [],
      dataSources: [
        {
          segment: 'geocode',
          provider: 'passthrough',
          note: 'Coordinates supplied by the user or source listing.',
          fallback: false,
          confidence: 100,
        },
      ],
    }
  }

  const query = buildBrazilLocationQuery(input)
  const warnings = []

  if (query) {
    try {
      const nominatim = await getNominatimGeocodeResult(input, options)
      if (nominatim) {
        return nominatim
      }

      warnings.push('Nominatim returned no usable coordinates.')
    } catch (error) {
      warnings.push(`Nominatim fallback: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  if (options.googleMapsApiKey && query) {
    try {
      const response = await fetchJsonWithTimeout(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${encodeURIComponent(options.googleMapsApiKey)}`,
        {
          fetch: options.fetchImpl,
          headers: options.headers,
        },
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS
      )

      const parsed = Array.isArray(response?.results) && response.results.length > 0
        ? parseGoogleGeocodeResult(response.results[0])
        : null

      if (parsed?.latitude !== null && parsed?.longitude !== null) {
        return {
          ...parsed,
          provider: 'google',
          confidence: 92,
          raw: response,
          warnings,
          dataSources: [
            {
              segment: 'geocode',
              provider: 'google',
              note: 'Google Geocoding resolved the location.',
              fallback: false,
              confidence: 92,
            },
          ],
        }
      }

      warnings.push('Google geocoding returned no usable coordinates.')
    } catch (error) {
      warnings.push(`Google geocoding fallback: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  const demo = locateDemoGeocode(query)
  if (demo) {
    return {
      latitude: demo.latitude,
      longitude: demo.longitude,
      address: compactLocationText(input.address, demo.neighborhood, demo.city, demo.state) || null,
      neighborhood: safeText(input.neighborhood) || demo.neighborhood,
      city: safeText(input.city) || demo.city,
      state: safeText(input.state) || demo.state,
      provider: 'mock',
      confidence: demo.confidence,
      raw: {
        source: 'demo_lookup',
        matchedQuery: query,
      },
      warnings,
      dataSources: [
        {
          segment: 'geocode',
          provider: 'mock',
          note: `Mock geocoding matched ${demo.city}, ${demo.state}.`,
          fallback: true,
          confidence: demo.confidence,
        },
      ],
    }
  }

  return {
    latitude: null,
    longitude: null,
    address: compactLocationText(input.address, input.neighborhood, input.city, input.state) || null,
    neighborhood: safeText(input.neighborhood) || null,
    city: safeText(input.city) || null,
    state: safeText(input.state) || null,
    provider: 'mock',
    confidence: 20,
    raw: {
      source: 'fallback',
      query,
    },
    warnings: warnings.length > 0 ? warnings : ['Geocoding fallback used.'],
    dataSources: [
      {
        segment: 'geocode',
        provider: 'mock',
        note: 'Mock geocoding could not resolve coordinates for this location.',
        fallback: true,
        confidence: 20,
      },
    ],
  }
}

function buildMockDemographicEstimate(location) {
  const normalized = normalizeLocationText(compactLocationText(
    location.neighborhood,
    location.city,
    location.state
  ))

  let avgIncome = 4300
  let populationDensity = 2200
  let confidence = 60
  let sourceNotes = ['Mock demographic data']

  if (/boa viagem|pina|graca|graca|espinheiro|madalena/.test(normalized)) {
    avgIncome = 8600
    populationDensity = 7200
    confidence = 66
    sourceNotes = ['Mock demographic data for higher-income urban district']
  } else if (/recife|olinda|jaboatao|jaboatão/.test(normalized)) {
    avgIncome = 6200
    populationDensity = 5400
    confidence = 64
    sourceNotes = ['Mock demographic data for metropolitan coastal area']
  } else if (/sao paulo|rio de janeiro|belo horizonte|brasilia|salvador|fortaleza/.test(normalized)) {
    avgIncome = 7000
    populationDensity = 6800
    confidence = 64
    sourceNotes = ['Mock demographic data for major Brazilian city']
  }

  return {
    avgIncome,
    populationDensity,
    provider: 'mock',
    confidence,
    sourceNotes,
    raw: {
      source: 'mock_demographics',
      matchedLocation: normalized,
    },
  }
}

async function buildSidraDemographicEstimate(location = {}, options = {}) {
  const municipalities = await fetchMunicipalitiesForState(location.state, options)
  const municipality = pickMunicipality(municipalities, location.city)

  if (!municipality) {
    return null
  }

  const [populationRows, incomeRows] = await Promise.all([
    fetchSidraRows(SIDRA_POPULATION_DENSITY_TABLE, municipality.id, options),
    fetchSidraRows(SIDRA_INCOME_TABLE, municipality.id, options),
  ])

  const populationValue = extractSidraValue(populationRows, (text) =>
    text.includes('popula') && text.includes('residente')
  )
  const densityValue = extractSidraValue(populationRows, (text) =>
    text.includes('densidade') && text.includes('demograf')
  )
  const incomeValue = extractSidraValue(incomeRows, (text) =>
    text.includes('rendimento') && text.includes('medio') && text.includes('per capita')
  )
  const medianIncomeValue = extractSidraValue(incomeRows, (text) =>
    text.includes('rendimento') && text.includes('mediano') && text.includes('per capita')
  )

  if (populationValue === null && densityValue === null && incomeValue === null && medianIncomeValue === null) {
    return null
  }

  const confidence = densityValue !== null && incomeValue !== null ? 88 : 72
  const sourceNotes = [
    `IBGE localities municipality match: ${municipality.nome}`,
    `SIDRA table 4714 population/density`,
    `SIDRA table 10295 income`,
  ]

  return {
    avgIncome: incomeValue ?? medianIncomeValue ?? null,
    populationDensity: densityValue ?? null,
    provider: 'sidra',
    confidence,
    sourceNotes,
    raw: {
      municipality,
      populationRows,
      incomeRows,
      populationValue,
      densityValue,
      incomeValue,
      medianIncomeValue,
    },
    dataSources: [
      {
        segment: 'demographics',
        provider: 'sidra',
        note: `IBGE SIDRA resolved ${municipality.nome}.`,
        fallback: false,
        confidence,
      },
    ],
  }
}

const SidraDemographicsProvider = {
  name: 'sidra',
  async resolve(location, options) {
    return buildSidraDemographicEstimate(location, options)
  },
}

const MockDemographicsProvider = {
  name: 'mock',
  async resolve(location) {
    return buildMockDemographicEstimate(location)
  },
}

async function getDemographicEstimate(location = {}, options = {}) {
  const providers = Array.isArray(options.demographicProviders) && options.demographicProviders.length > 0
    ? options.demographicProviders
    : [options.demographicProvider, SidraDemographicsProvider, MockDemographicsProvider].filter(Boolean)

  const warnings = []

  for (const provider of providers) {
    try {
      const result = await provider.resolve(location, options)
      if (result) {
        return {
          avgIncome: result.avgIncome ?? null,
          populationDensity: result.populationDensity ?? null,
          provider: result.provider ?? provider.name ?? 'mock',
          confidence: clampConfidence(result.confidence ?? 60),
          sourceNotes: Array.isArray(result.sourceNotes) ? result.sourceNotes : [],
          raw: result.raw ?? null,
          warnings,
          dataSources: [
            {
              segment: 'demographics',
              provider: result.provider ?? provider.name ?? 'mock',
              note: Array.isArray(result.sourceNotes) && result.sourceNotes.length > 0
                ? result.sourceNotes.join('; ')
                : 'Demographic estimate resolved.',
              fallback: (result.provider ?? provider.name ?? 'mock') === 'mock',
              confidence: clampConfidence(result.confidence ?? 60),
            },
          ],
        }
      }
    } catch (error) {
      warnings.push(`${provider.name ?? 'demographics'} fallback: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  const fallback = buildMockDemographicEstimate(location)
  return {
    ...fallback,
    warnings: warnings.length > 0 ? warnings : ['Demographic fallback used.'],
    dataSources: [
      {
        segment: 'demographics',
        provider: 'mock',
        note: 'Mock demographic estimate used.',
        fallback: true,
        confidence: fallback.confidence,
      },
    ],
  }
}

function mapGooglePlaceResult(place, origin) {
  const geometry = place?.geometry?.location
  const lat = toCoordinateNumber(geometry?.lat)
  const lng = toCoordinateNumber(geometry?.lng)

  return {
    name: safeText(place?.name) || 'Negócio próximo',
    category: safeText(place?.types?.[0] ?? 'place'),
    distanceMeters: isValidCoordinatePair(origin?.lat, origin?.lng) && isValidCoordinatePair(lat, lng)
      ? geoDistanceMeters(origin, { lat, lng })
      : null,
    address: safeText(place?.vicinity ?? place?.formatted_address) || null,
    source: 'google_places',
  }
}

async function getNearbyBusinesses(location = {}, options = {}) {
  const latitude = toCoordinateNumber(location.latitude)
  const longitude = toCoordinateNumber(location.longitude)
  const warnings = []

  if (options.googleMapsApiKey && isValidCoordinatePair(latitude, longitude)) {
    try {
      const response = await fetchJsonWithTimeout(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&key=${encodeURIComponent(options.googleMapsApiKey)}`,
        {
          fetch: options.fetchImpl,
          headers: options.headers,
        },
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS
      )

      const results = Array.isArray(response?.results) ? response.results : []
      const businesses = results.slice(0, 8).map((place) => mapGooglePlaceResult(place, { lat: latitude, lng: longitude }))

      if (businesses.length > 0) {
        return {
          businesses,
          provider: 'google_places',
          confidence: 85,
          raw: response,
          warnings,
          dataSources: [
            {
              segment: 'places',
              provider: 'google_places',
              note: 'Google Places nearby search returned businesses.',
              fallback: false,
              confidence: 85,
            },
          ],
        }
      }

      warnings.push('Google Places returned no nearby businesses.')
    } catch (error) {
      warnings.push(`Google Places fallback: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  return {
    businesses: [],
    provider: 'unavailable',
    confidence: 0,
    raw: {
      source: 'places_unavailable',
      city: safeText(location.city),
      state: safeText(location.state),
    },
    warnings: warnings.length > 0 ? warnings : ['Nearby business data unavailable. Configure Google Places to enable this section.'],
    dataSources: [
      {
        segment: 'places',
        provider: 'unavailable',
        note: 'Nearby businesses were not generated because no reliable places provider returned data.',
        fallback: true,
        confidence: 0,
      },
    ],
  }
}

function deriveConsumerProfile(result = {}) {
  const businesses = Array.isArray(result.nearbyBusinesses) ? result.nearbyBusinesses : []
  const categories = new Set(
    businesses.map((business) => normalizeLocationText(business.category))
  )

  const avgIncome = Number(result.avgIncome ?? 0)
  const populationDensity = Number(result.populationDensity ?? 0)

  const parts = []

  if (avgIncome >= 7500 || categories.has('bank') || categories.has('gym') || categories.has('restaurant')) {
    parts.push('Público de renda mais alta com foco em conveniência e serviços.')
  } else if (avgIncome >= 5000 || categories.has('supermarket') || categories.has('pharmacy')) {
    parts.push('Perfil misto de bairro consolidado com consumo de rotina.')
  } else {
    parts.push('Perfil base de bairro com dados estimados.')
  }

  if (populationDensity >= 6500) {
    parts.push('Alta densidade favorece fluxo de pedestres.')
  } else if (populationDensity >= 3500) {
    parts.push('Densidade intermediária apoia demanda local estável.')
  }

  if (categories.has('supermarket') || categories.has('pharmacy') || categories.has('restaurant')) {
    parts.push('Mix de serviços essenciais próximos.')
  }

  return parts.join(' ')
}

async function resolveLocationIntelligence(input = {}, options = {}) {
  const geocode = await geocodeLocation(input, options)
  const resolvedLocation = {
    address: compactLocationText(
      input.address,
      geocode.address,
      input.neighborhood,
      geocode.neighborhood,
      input.city,
      geocode.city,
      input.state,
      geocode.state
    ) || null,
    neighborhood: safeText(input.neighborhood) || geocode.neighborhood || null,
    city: safeText(input.city) || geocode.city || 'Cidade não informada',
    state: safeText(input.state) || geocode.state || 'BR',
    country: safeText(input.country) || 'BR',
    latitude: geocode.latitude,
    longitude: geocode.longitude,
  }

  const demographics = await getDemographicEstimate(resolvedLocation, options)
  const places = await getNearbyBusinesses(resolvedLocation, options)
  const consumerProfile = deriveConsumerProfile({
    ...resolvedLocation,
    avgIncome: demographics.avgIncome,
    populationDensity: demographics.populationDensity,
    nearbyBusinesses: places.businesses,
  })

  const dataSources = [
    ...(geocode.dataSources ?? []),
    ...(demographics.dataSources ?? []),
    ...(places.dataSources ?? []),
    {
      segment: 'profile',
      provider: 'rule-based',
      note: consumerProfile,
      fallback: false,
      confidence: 100,
    },
  ]

  const confidenceScore = clampConfidence(
    Math.round((geocode.confidence + demographics.confidence + places.confidence) / 3)
  )

  return {
    ...resolvedLocation,
    avgIncome: demographics.avgIncome,
    populationDensity: demographics.populationDensity,
    consumerProfile,
    nearbyBusinesses: places.businesses,
    dataSources,
    confidenceScore,
    rawGeocode: geocode.raw ?? {},
    rawDemographics: demographics.raw ?? {},
    rawPlaces: places.raw ?? {},
    warnings: [
      ...(geocode.warnings ?? []),
      ...(demographics.warnings ?? []),
      ...(places.warnings ?? []),
    ],
    providers: {
      geocode: geocode.provider,
      demographics: demographics.provider,
      places: places.provider,
    },
  }
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  MockDemographicsProvider,
  SidraDemographicsProvider,
  buildBrazilLocationQuery,
  clampConfidence,
  compactLocationText,
  deriveConsumerProfile,
  fetchJsonWithTimeout,
  geocodeLocation,
  getDemographicEstimate,
  getNearbyBusinesses,
  geoDistanceMeters,
  normalizeLocationText,
  resolveLocationIntelligence,
}
