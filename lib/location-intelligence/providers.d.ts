export type LocationIntelligenceDataSource = {
  segment?: 'geocode' | 'demographics' | 'places' | 'profile'
  provider: string
  note: string
  fallback: boolean
  confidence?: number
}

export type GeocodeInput = {
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
}

export type GeocodeResult = {
  latitude: number | null
  longitude: number | null
  address: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  provider: 'google' | 'nominatim' | 'mock' | 'passthrough' | string
  confidence: number
  raw: unknown
  warnings: string[]
  dataSources: LocationIntelligenceDataSource[]
}

export type DemographicEstimate = {
  avgIncome: number | null
  populationDensity: number | null
  provider: 'mock' | 'external' | 'ibge_future' | string
  confidence: number
  sourceNotes: string[]
  raw: unknown
  warnings: string[]
  dataSources: LocationIntelligenceDataSource[]
}

export type NearbyBusiness = {
  name: string
  category: string
  distanceMeters?: number | null
  address?: string | null
  source: string
}

export type NearbyBusinessesResult = {
  businesses: NearbyBusiness[]
  provider: 'google_places' | 'unavailable' | string
  confidence: number
  raw: unknown
  warnings: string[]
  dataSources: LocationIntelligenceDataSource[]
}

export type ResolvedLocationIntelligence = {
  listingId?: string | null
  address?: string | null
  neighborhood?: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  avgIncome: number | null
  populationDensity: number | null
  consumerProfile: string
  nearbyBusinesses: NearbyBusiness[]
  dataSources: LocationIntelligenceDataSource[]
  confidenceScore: number
  rawGeocode: unknown
  rawDemographics: unknown
  rawPlaces: unknown
  warnings?: string[]
  providers?: {
    geocode: string
    demographics: string
    places: string
  }
}

export type DemographicProvider = {
  name: string
  resolve(location: Record<string, unknown>, options?: Record<string, unknown>): Promise<Partial<DemographicEstimate> | null> | Partial<DemographicEstimate> | null
}

export declare const DEFAULT_TIMEOUT_MS: number
export declare const MockDemographicsProvider: DemographicProvider
export declare function fetchJsonWithTimeout(url: string, init?: Record<string, unknown>, timeoutMs?: number): Promise<unknown>
export declare function geocodeLocation(input?: GeocodeInput, options?: Record<string, unknown>): Promise<GeocodeResult>
export declare function getDemographicEstimate(location?: Record<string, unknown>, options?: Record<string, unknown>): Promise<DemographicEstimate>
export declare function getNearbyBusinesses(location?: Record<string, unknown>, options?: Record<string, unknown>): Promise<NearbyBusinessesResult>
export declare function deriveConsumerProfile(result?: Record<string, unknown>): string
export declare function resolveLocationIntelligence(input?: GeocodeInput & Record<string, unknown>, options?: Record<string, unknown>): Promise<ResolvedLocationIntelligence>
