/* eslint-disable @typescript-eslint/no-require-imports */
const {
  buildLocationQuery,
  clampConfidence,
  compactLocationText,
  normalizeLocationText,
} = require('./normalization.js')

const DEFAULT_TIMEOUT_MS = 4000
const DEFAULT_NOMINATIM_USER_AGENT = 'RealTools/1.5'
const DEFAULT_NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const DEFAULT_GEOAPI_PT_BASE_URL = 'https://json.geoapi.pt'

// Portuguese CP7 postal code, e.g. 4710-057
const CP7_RE = /\b(\d{4}-\d{3})\b/

const DEMO_GEO_LOOKUPS = [
  {
    terms: ['lisboa', 'lisbon'],
    latitude: 38.7223,
    longitude: -9.1393,
    city: 'Lisboa',
    state: 'Lisboa',
    neighborhood: null,
    confidence: 66,
  },
  {
    terms: ['avenida da liberdade', 'baixa, lisboa', 'chiado'],
    latitude: 38.7197,
    longitude: -9.1427,
    city: 'Lisboa',
    state: 'Lisboa',
    neighborhood: 'Avenida da Liberdade',
    confidence: 70,
  },
  {
    terms: ['porto', 'oporto'],
    latitude: 41.1579,
    longitude: -8.6291,
    city: 'Porto',
    state: 'Porto',
    neighborhood: null,
    confidence: 66,
  },
  {
    terms: ['vila nova de gaia', 'gaia'],
    latitude: 41.1239,
    longitude: -8.6118,
    city: 'Vila Nova de Gaia',
    state: 'Porto',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['braga'],
    latitude: 41.5454,
    longitude: -8.4265,
    city: 'Braga',
    state: 'Braga',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['coimbra'],
    latitude: 40.2033,
    longitude: -8.4103,
    city: 'Coimbra',
    state: 'Coimbra',
    neighborhood: null,
    confidence: 64,
  },
  {
    terms: ['aveiro'],
    latitude: 40.6405,
    longitude: -8.6538,
    city: 'Aveiro',
    state: 'Aveiro',
    neighborhood: null,
    confidence: 63,
  },
  {
    terms: ['faro'],
    latitude: 37.0194,
    longitude: -7.9304,
    city: 'Faro',
    state: 'Faro',
    neighborhood: null,
    confidence: 63,
  },
  {
    terms: ['cascais'],
    latitude: 38.6979,
    longitude: -9.4215,
    city: 'Cascais',
    state: 'Lisboa',
    neighborhood: null,
    confidence: 63,
  },
  {
    terms: ['sintra'],
    latitude: 38.8029,
    longitude: -9.3817,
    city: 'Sintra',
    state: 'Lisboa',
    neighborhood: null,
    confidence: 63,
  },
  {
    terms: ['funchal', 'madeira'],
    latitude: 32.6669,
    longitude: -16.9241,
    city: 'Funchal',
    state: 'Madeira',
    neighborhood: null,
    confidence: 62,
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

// Pull a CP7 postal code out of any of the supplied free-text fields.
function extractPostalCode(...texts) {
  for (const text of texts) {
    const match = String(text ?? '').match(CP7_RE)
    if (match) return match[1]
  }
  return null
}

// "Vila Nova de Gaia" -> "vila-nova-de-gaia" for geoapi.pt municipio paths.
function slugifyConcelho(name) {
  return normalizeLooseText(name).replace(/\s+/g, '-')
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
  const state = address.state ?? address.region ?? address.province ?? address.district ?? null
  const neighborhood = address.neighbourhood ?? address.suburb ?? address.quarter ?? null

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
  const query = buildLocationQuery(input)
  if (!query) return null

  const url = new URL('/search', baseUrl)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'pt')
  url.searchParams.set('accept-language', 'pt-PT')
  url.searchParams.set('q', query)
  return url.toString()
}

// geoapi.pt — postal code (CP7) lookup. Returns concelho/distrito/freguesia + address points.
async function fetchGeoapiPostalCode(postalCode, options = {}) {
  const baseUrl = options.geoapiPtBaseUrl ?? DEFAULT_GEOAPI_PT_BASE_URL
  const url = `${baseUrl}/cp/${encodeURIComponent(postalCode)}?json=1`
  const response = await fetchJsonWithTimeout(
    url,
    {
      fetch: options.fetchImpl,
      headers: options.headers,
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  )

  if (!response || typeof response !== 'object' || response.erro) return null
  return response
}

// geoapi.pt — municipality (concelho) lookup. Returns area + centroid + freguesias.
async function fetchGeoapiMunicipio(concelho, options = {}) {
  const slug = slugifyConcelho(concelho)
  if (!slug) return null

  const baseUrl = options.geoapiPtBaseUrl ?? DEFAULT_GEOAPI_PT_BASE_URL
  const url = `${baseUrl}/municipio/${encodeURIComponent(slug)}?json=1`
  const response = await fetchJsonWithTimeout(
    url,
    {
      fetch: options.fetchImpl,
      headers: options.headers,
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  )

  if (!response || typeof response !== 'object' || response.erro || !response.nome) return null
  return response
}

// geoapi.pt postal-code geocode. Coordinates in geoapi.pt are [lat, lng].
async function getGeoapiPtGeocodeResult(input = {}, options = {}) {
  const postalCode = extractPostalCode(input.postalCode, input.address, input.neighborhood, input.locationText)
  if (!postalCode) return null

  const cp = await fetchGeoapiPostalCode(postalCode, options)
  if (!cp) return null

  const point = Array.isArray(cp.pontos) ? cp.pontos.find((entry) => Array.isArray(entry?.coordenadas)) : null
  const latitude = toCoordinateNumber(point?.coordenadas?.[0])
  const longitude = toCoordinateNumber(point?.coordenadas?.[1])
  if (!isValidCoordinatePair(latitude, longitude)) return null

  const concelho = safeText(cp.Concelho) || null
  const distrito = safeText(cp.Distrito) || null
  const freguesia = safeText(cp.partes?.[0]?.Local) || null

  return {
    latitude,
    longitude,
    address: compactLocationText(input.address, cp.partes?.[0]?.Artéria, freguesia, concelho, distrito) || null,
    neighborhood: safeText(input.neighborhood) || freguesia,
    city: safeText(input.city) || concelho,
    state: safeText(input.state) || distrito,
    provider: 'geoapi_pt',
    confidence: 95,
    raw: cp,
    warnings: [],
    dataSources: [
      {
        segment: 'geocode',
        provider: 'geoapi_pt',
        note: `geoapi.pt resolveu o código postal ${postalCode}.`,
        fallback: false,
        confidence: 95,
      },
    ],
  }
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

  const query = buildLocationQuery(input)
  const warnings = []

  // Primary: geoapi.pt postal-code geocoding (PT-specific, no key required).
  try {
    const geoapi = await getGeoapiPtGeocodeResult(input, options)
    if (geoapi) {
      return geoapi
    }
  } catch (error) {
    warnings.push(`geoapi.pt fallback: ${error instanceof Error ? error.message : 'unknown error'}`)
  }

  // Fallback: Nominatim (OpenStreetMap).
  if (query) {
    try {
      const nominatim = await getNominatimGeocodeResult(input, options)
      if (nominatim) {
        return { ...nominatim, warnings: [...warnings, ...nominatim.warnings] }
      }

      warnings.push('Nominatim returned no usable coordinates.')
    } catch (error) {
      warnings.push(`Nominatim fallback: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  // Fallback: Google Geocoding (only if an API key is configured).
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

// Portugal has no fabricated demographic source wired. Income/density are returned null
// (honest "no data") rather than invented. Wire INE (ine.pt) here for real figures.
function buildMockDemographicEstimate(location) {
  const normalized = normalizeLocationText(compactLocationText(
    location.neighborhood,
    location.city,
    location.state
  ))

  return {
    avgIncome: null,
    populationDensity: null,
    provider: 'mock',
    confidence: 25,
    sourceNotes: ['Dados demográficos indisponíveis para Portugal (INE não integrado).'],
    raw: {
      source: 'demographics_unavailable',
      matchedLocation: normalized,
    },
  }
}

// geoapi.pt municipality enrichment. Resolves the concelho (via postal code or city) and
// returns its administrative metadata + area. geoapi.pt's free tier exposes no census
// population, so avgIncome/populationDensity stay null until INE is integrated.
async function buildGeoapiPtDemographicEstimate(location = {}, options = {}) {
  const postalCode = extractPostalCode(location.postalCode, location.address, location.neighborhood, location.locationText)
  let concelho = safeText(location.city) || null
  let postalRaw = null

  if (postalCode) {
    postalRaw = await fetchGeoapiPostalCode(postalCode, options).catch(() => null)
    if (postalRaw?.Concelho) concelho = postalRaw.Concelho
  }

  if (!concelho) return null

  const municipio = await fetchGeoapiMunicipio(concelho, options)
  if (!municipio) return null

  const areaHa =
    toCoordinateNumber(municipio?.geojson?.properties?.Area_T_ha) ??
    toCoordinateNumber(municipio.areaha)
  const areaKm2 = Number.isFinite(areaHa) ? Math.round((areaHa / 100) * 10) / 10 : null
  const distrito = safeText(municipio.distrito) || null

  return {
    // No PT income/density via geoapi.pt free tier — see note above. Left null intentionally.
    avgIncome: null,
    populationDensity: null,
    provider: 'geoapi_pt',
    confidence: 55,
    sourceNotes: [
      `geoapi.pt concelho: ${municipio.nome}${distrito ? `, distrito de ${distrito}` : ''}`,
      areaKm2 !== null ? `Área do concelho: ${areaKm2} km²` : null,
      'Rendimento e densidade: INE não integrado (sem equivalente direto via geoapi.pt).',
    ].filter(Boolean),
    raw: {
      concelho: municipio.nome,
      distrito,
      areaKm2,
      postal: postalRaw,
    },
    dataSources: [
      {
        segment: 'demographics',
        provider: 'geoapi_pt',
        note: `geoapi.pt resolveu o concelho ${municipio.nome}.`,
        fallback: false,
        confidence: 55,
      },
    ],
  }
}

const GeoapiPtDemographicsProvider = {
  name: 'geoapi_pt',
  async resolve(location, options) {
    return buildGeoapiPtDemographicEstimate(location, options)
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
    : [options.demographicProvider, GeoapiPtDemographicsProvider, MockDemographicsProvider].filter(Boolean)

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
        note: 'Negócios próximos não foram gerados porque nenhum provedor confiável de lugares retornou dados.',
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
    state: safeText(input.state) || geocode.state || 'PT',
    country: safeText(input.country) || 'PT',
    postalCode: extractPostalCode(input.postalCode, input.address, input.neighborhood, input.locationText),
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
  GeoapiPtDemographicsProvider,
  buildLocationQuery,
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
