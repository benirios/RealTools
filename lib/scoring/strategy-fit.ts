import type { LocationInsightPersisted } from '@/lib/schemas/location-insight'
import type { Database } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']

export const STRATEGY_FIT_SLUGS = [
  'retail',
  'warehouse_logistics',
  'rental_income',
  'food_beverage',
  'pharmacy',
  'gym_fitness',
] as const

export type StrategyFitSlug = (typeof STRATEGY_FIT_SLUGS)[number]
export type ScoreConfidence = 'low' | 'medium' | 'high'

export type StrategyFitBreakdown = {
  location: number
  demographics: number
  commercial_activity: number
  risk_adjusted: number
}

export type StrategyFitScoreResult = {
  strategy: StrategyFitSlug
  score: number
  confidence: ScoreConfidence
  breakdown: StrategyFitBreakdown
  strengths: string[]
  weaknesses: string[]
  best_fit_reasons: string[]
  missing_data: string[]
}

export type StrategyFitPoint = Partial<ListingRow> & {
  listing?: Partial<ListingRow> | null
  location_insight?: Partial<LocationInsightPersisted> | Record<string, unknown> | null
  locationInsight?: Partial<LocationInsightPersisted> | Record<string, unknown> | null
  insight?: Partial<LocationInsightPersisted> | Record<string, unknown> | null
}

type NearbyBusiness = {
  name?: string | null
  category?: string | null
  distanceMeters?: number | null
  distance_meters?: number | null
}

type FactorKey =
  | 'pedestrianTraffic'
  | 'visibility'
  | 'incomeCompatibility'
  | 'anchorProximity'
  | 'accessibility'
  | 'roadAccess'
  | 'priceEfficiency'
  | 'industrialProximity'
  | 'parkingLoading'
  | 'residentialDensity'
  | 'stableCommerce'
  | 'demandPredictability'
  | 'riskProfile'
  | 'officeResidentialDensity'
  | 'complementaryBusinesses'
  | 'competitionBalance'
  | 'lowCompetition'
  | 'lowDirectCompetition'
  | 'olderPopulation'

type CategoryKey = keyof StrategyFitBreakdown

type StrategyFitConfig = {
  label: string
  categoryWeights: Record<CategoryKey, number>
  factorWeights: Partial<Record<FactorKey, number>>
  affinities: string[]
  conflicts: string[]
}

export const STRATEGY_FIT_CONFIG: Record<StrategyFitSlug, StrategyFitConfig> = {
  retail: {
    label: 'Varejo',
    categoryWeights: { location: 0.34, demographics: 0.24, commercial_activity: 0.30, risk_adjusted: 0.12 },
    factorWeights: {
      pedestrianTraffic: 0.20,
      visibility: 0.18,
      incomeCompatibility: 0.16,
      anchorProximity: 0.16,
      accessibility: 0.15,
      competitionBalance: 0.08,
      riskProfile: 0.07,
    },
    affinities: ['mall', 'shopping', 'supermarket', 'bank', 'office', 'transit', 'school'],
    conflicts: ['retail', 'store', 'loja', 'clothing', 'vestuario'],
  },
  warehouse_logistics: {
    label: 'Galpao / Logistica',
    categoryWeights: { location: 0.42, demographics: 0.06, commercial_activity: 0.18, risk_adjusted: 0.34 },
    factorWeights: {
      roadAccess: 0.24,
      priceEfficiency: 0.20,
      industrialProximity: 0.18,
      parkingLoading: 0.18,
      accessibility: 0.10,
      riskProfile: 0.10,
    },
    affinities: ['highway', 'rodovia', 'industrial', 'warehouse', 'galpao', 'port', 'distribution', 'logistica'],
    conflicts: [],
  },
  rental_income: {
    label: 'Renda de aluguel',
    categoryWeights: { location: 0.20, demographics: 0.22, commercial_activity: 0.28, risk_adjusted: 0.30 },
    factorWeights: {
      stableCommerce: 0.20,
      demandPredictability: 0.19,
      riskProfile: 0.18,
      anchorProximity: 0.15,
      pedestrianTraffic: 0.10,
      incomeCompatibility: 0.10,
      priceEfficiency: 0.08,
    },
    affinities: ['bank', 'supermarket', 'school', 'hospital', 'office', 'residential', 'mall'],
    conflicts: [],
  },
  food_beverage: {
    label: 'Alimentacao',
    categoryWeights: { location: 0.32, demographics: 0.18, commercial_activity: 0.36, risk_adjusted: 0.14 },
    factorWeights: {
      pedestrianTraffic: 0.20,
      officeResidentialDensity: 0.16,
      complementaryBusinesses: 0.16,
      visibility: 0.15,
      competitionBalance: 0.14,
      accessibility: 0.10,
      riskProfile: 0.09,
    },
    affinities: ['office', 'school', 'university', 'mall', 'park', 'residential', 'transit'],
    conflicts: ['restaurant', 'cafe', 'bakery', 'coffee', 'lanchonete', 'bar'],
  },
  pharmacy: {
    label: 'Farmacia',
    categoryWeights: { location: 0.24, demographics: 0.30, commercial_activity: 0.30, risk_adjusted: 0.16 },
    factorWeights: {
      residentialDensity: 0.20,
      olderPopulation: 0.10,
      lowCompetition: 0.18,
      accessibility: 0.16,
      anchorProximity: 0.16,
      incomeCompatibility: 0.10,
      riskProfile: 0.10,
    },
    affinities: ['hospital', 'clinic', 'ubs', 'school', 'residential', 'supermarket'],
    conflicts: ['pharmacy', 'drugstore', 'farmacia', 'drogaria'],
  },
  gym_fitness: {
    label: 'Academia / Fitness',
    categoryWeights: { location: 0.28, demographics: 0.28, commercial_activity: 0.26, risk_adjusted: 0.18 },
    factorWeights: {
      residentialDensity: 0.18,
      incomeCompatibility: 0.16,
      parkingLoading: 0.14,
      accessibility: 0.12,
      complementaryBusinesses: 0.13,
      lowDirectCompetition: 0.15,
      riskProfile: 0.12,
    },
    affinities: ['residential', 'office', 'school', 'park', 'health', 'parking'],
    conflicts: ['gym', 'academia', 'fitness', 'crossfit', 'pilates'],
  },
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getInsight(point: StrategyFitPoint): Record<string, unknown> {
  return (point.location_insight ?? point.locationInsight ?? point.insight ?? {}) as Record<string, unknown>
}

function getListing(point: StrategyFitPoint): Record<string, unknown> {
  return (point.listing ?? point) as Record<string, unknown>
}

function getNearby(insight: Record<string, unknown>): NearbyBusiness[] {
  const nearby = insight.nearbyBusinesses ?? insight.nearby_businesses
  return Array.isArray(nearby) ? nearby as NearbyBusiness[] : []
}

function getInsightNumber(insight: Record<string, unknown>, camel: string, snake: string): number | null {
  return asNumber(insight[camel] ?? insight[snake])
}

function categoryMatches(category: unknown, terms: string[]): boolean {
  const normalized = normalize(category)
  return terms.some((term) => normalized.includes(normalize(term)))
}

function countNearby(nearby: NearbyBusiness[], terms: string[], maxDistance = 800): number {
  return nearby.filter((business) => {
    const distance = asNumber(business.distanceMeters ?? business.distance_meters)
    return (distance === null || distance <= maxDistance) && categoryMatches(business.category, terms)
  }).length
}

function tagsText(listing: Record<string, unknown>): string {
  const tags = Array.isArray(listing.tags) ? listing.tags.join(' ') : ''
  return normalize([
    tags,
    listing.title,
    listing.description,
    listing.property_type,
    listing.commercial_type,
  ].filter(Boolean).join(' '))
}

function scoreFromCount(count: number, one = 62, two = 78, many = 90): number {
  if (count <= 0) return 35
  if (count === 1) return one
  if (count <= 3) return two
  return many
}

function scoreIncome(income: number | null): number {
  if (income === null) return 45
  if (income < 1500) return 25
  if (income < 2500) return 45
  if (income < 4000) return 64
  if (income < 7000) return 84
  return 94
}

function scoreDensity(density: number | null): number {
  if (density === null) return 45
  if (density < 800) return 28
  if (density < 2500) return 50
  if (density < 6000) return 72
  return 90
}

function scorePriceEfficiency(price: number | null): number {
  if (price === null) return 55
  if (price < 250000) return 88
  if (price < 650000) return 76
  if (price < 1500000) return 62
  if (price < 3500000) return 48
  return 35
}

function weightedAverage(entries: Array<[number, number]>): number {
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (totalWeight <= 0) return 0
  return clamp(entries.reduce((sum, [score, weight]) => sum + score * weight, 0) / totalWeight)
}

function confidenceFor(missingData: string[], insightConfidence: number | null): ScoreConfidence {
  if (missingData.length >= 4 || (insightConfidence !== null && insightConfidence < 45)) return 'low'
  if (missingData.length >= 2 || insightConfidence === null || insightConfidence < 70) return 'medium'
  return 'high'
}

function directCompetitionScore(count: number): number {
  if (count === 0) return 90
  if (count <= 2) return 72
  if (count <= 5) return 45
  return 22
}

function competitionBalanceScore(count: number): number {
  if (count === 0) return 68
  if (count <= 3) return 84
  if (count <= 6) return 55
  return 28
}

function addReason(target: string[], condition: boolean, label: string) {
  if (condition && !target.includes(label)) target.push(label)
}

export function calculateStrategyFitScore(
  point: StrategyFitPoint,
  strategy: StrategyFitSlug | string
): StrategyFitScoreResult {
  const strategySlug = STRATEGY_FIT_SLUGS.includes(strategy as StrategyFitSlug)
    ? strategy as StrategyFitSlug
    : 'retail'
  const config = STRATEGY_FIT_CONFIG[strategySlug]
  const listing = getListing(point)
  const insight = getInsight(point)
  const nearby = getNearby(insight)
  const text = tagsText(listing)
  const missingData: string[] = []

  const income = getInsightNumber(insight, 'avgIncome', 'avg_income')
  const density = getInsightNumber(insight, 'populationDensity', 'population_density')
  const insightConfidence = getInsightNumber(insight, 'confidenceScore', 'confidence_score')
  const price = asNumber(listing.price_amount ?? listing.priceAmount ?? listing.price)
  const hasCoords = asNumber(insight.latitude) !== null || asNumber(listing.lat) !== null

  if (Object.keys(insight).length === 0) missingData.push('location_insight')
  if (income === null) missingData.push('avg_income')
  if (density === null) missingData.push('population_density')
  if (insightConfidence === null) missingData.push('confidence_score')
  if (nearby.length === 0) missingData.push('nearby_businesses')
  if (price === null) missingData.push('price_amount')
  if (!text) missingData.push('listing_tags_or_description')
  if (strategySlug === 'pharmacy') missingData.push('older_population')

  const trafficTerms = ['transit', 'bus', 'metro', 'station', 'terminal', 'school', 'university', 'mall', 'shopping', 'hospital', 'clinic', 'supermarket']
  const roadTerms = ['highway', 'rodovia', 'road', 'avenida', 'br-', 'port', 'warehouse', 'industrial', 'distribution', 'logistica']
  const parkingTerms = ['parking', 'estacionamento', 'garage', 'garagem', 'loading', 'doca', 'carga']
  const officeResidentialTerms = ['office', 'escritorio', 'residential', 'residencial', 'condominio', 'school', 'university']

  const trafficCount = countNearby(nearby, trafficTerms, 700)
  const anchorCount = countNearby(nearby, config.affinities, 900)
  const conflictCount = countNearby(nearby, config.conflicts, 700)
  const roadCount = countNearby(nearby, roadTerms, 1200)
  const parkingCount = countNearby(nearby, parkingTerms, 800)
  const officeResidentialCount = countNearby(nearby, officeResidentialTerms, 900)

  const visibilityScore = text.includes('frente') || text.includes('vitrine') || text.includes('esquina') || text.includes('street_front') || text.includes('loja')
    ? 84
    : text.includes('sala') || text.includes('ponto')
      ? 68
      : 48
  const accessibilityScore = clamp((insightConfidence ?? 55) * 0.55 + (hasCoords ? 22 : 8) + scoreFromCount(trafficCount, 55, 70, 82) * 0.20)
  const riskProfileScore = clamp((insightConfidence ?? 55) * 0.55 + (nearby.length > 0 ? 22 : 8) + (income !== null ? 12 : 4) + (density !== null ? 11 : 4))
  const stableCommerceScore = clamp(scoreFromCount(anchorCount, 58, 76, 88) + (text.includes('locado') || text.includes('leased') || text.includes('stable') ? 10 : 0))
  const demandPredictabilityScore = weightedAverage([
    [scoreDensity(density), 0.35],
    [scoreIncome(income), 0.25],
    [scoreFromCount(anchorCount, 58, 78, 88), 0.25],
    [riskProfileScore, 0.15],
  ])

  const factors: Record<FactorKey, number> = {
    pedestrianTraffic: scoreFromCount(trafficCount, 60, 78, 92),
    visibility: visibilityScore,
    incomeCompatibility: scoreIncome(income),
    anchorProximity: scoreFromCount(anchorCount, 60, 78, 90),
    accessibility: accessibilityScore,
    roadAccess: scoreFromCount(roadCount, 64, 82, 92),
    priceEfficiency: scorePriceEfficiency(price),
    industrialProximity: scoreFromCount(countNearby(nearby, ['industrial', 'warehouse', 'galpao', 'distribution', 'port'], 1500), 66, 82, 92),
    parkingLoading: Math.max(scoreFromCount(parkingCount, 62, 78, 88), categoryMatches(text, parkingTerms) ? 82 : 42),
    residentialDensity: scoreDensity(density),
    stableCommerce: stableCommerceScore,
    demandPredictability: demandPredictabilityScore,
    riskProfile: riskProfileScore,
    officeResidentialDensity: Math.max(scoreDensity(density), scoreFromCount(officeResidentialCount, 58, 76, 88)),
    complementaryBusinesses: scoreFromCount(anchorCount, 58, 78, 90),
    competitionBalance: competitionBalanceScore(conflictCount),
    lowCompetition: directCompetitionScore(conflictCount),
    lowDirectCompetition: directCompetitionScore(conflictCount),
    olderPopulation: 50,
  }

  const breakdown: StrategyFitBreakdown = {
    location: weightedAverage([
      [factors.pedestrianTraffic, config.factorWeights.pedestrianTraffic ?? 0],
      [factors.visibility, config.factorWeights.visibility ?? 0],
      [factors.accessibility, config.factorWeights.accessibility ?? 0],
      [factors.roadAccess, config.factorWeights.roadAccess ?? 0],
      [factors.parkingLoading, config.factorWeights.parkingLoading ?? 0],
    ]),
    demographics: weightedAverage([
      [factors.incomeCompatibility, config.factorWeights.incomeCompatibility ?? 0],
      [factors.residentialDensity, config.factorWeights.residentialDensity ?? 0],
      [factors.officeResidentialDensity, config.factorWeights.officeResidentialDensity ?? 0],
      [factors.olderPopulation, config.factorWeights.olderPopulation ?? 0],
    ]),
    commercial_activity: weightedAverage([
      [factors.anchorProximity, config.factorWeights.anchorProximity ?? 0],
      [factors.complementaryBusinesses, config.factorWeights.complementaryBusinesses ?? 0],
      [factors.competitionBalance, config.factorWeights.competitionBalance ?? 0],
      [factors.lowCompetition, config.factorWeights.lowCompetition ?? 0],
      [factors.lowDirectCompetition, config.factorWeights.lowDirectCompetition ?? 0],
      [factors.industrialProximity, config.factorWeights.industrialProximity ?? 0],
      [factors.stableCommerce, config.factorWeights.stableCommerce ?? 0],
    ]),
    risk_adjusted: weightedAverage([
      [factors.riskProfile, config.factorWeights.riskProfile ?? 0],
      [factors.priceEfficiency, config.factorWeights.priceEfficiency ?? 0],
      [factors.demandPredictability, config.factorWeights.demandPredictability ?? 0],
    ]),
  }

  const score = clamp(
    breakdown.location * config.categoryWeights.location +
    breakdown.demographics * config.categoryWeights.demographics +
    breakdown.commercial_activity * config.categoryWeights.commercial_activity +
    breakdown.risk_adjusted * config.categoryWeights.risk_adjusted
  )

  const strengths: string[] = []
  const weaknesses: string[] = []
  const bestFitReasons: string[] = []

  addReason(strengths, breakdown.location >= 72, 'Localizacao favorece a estrategia selecionada.')
  addReason(strengths, breakdown.demographics >= 72, 'Demografia compativel com a demanda esperada.')
  addReason(strengths, breakdown.commercial_activity >= 72, 'Atividade comercial proxima sustenta o uso.')
  addReason(strengths, breakdown.risk_adjusted >= 72, 'Perfil ajustado a risco e previsibilidade e favoravel.')
  addReason(weaknesses, breakdown.location < 50, 'Localizacao tem sinais fracos para esta estrategia.')
  addReason(weaknesses, breakdown.demographics < 50, 'Demografia disponivel nao sustenta bem a tese.')
  addReason(weaknesses, breakdown.commercial_activity < 50, 'Poucos sinais de atividade ou complementaridade comercial.')
  addReason(weaknesses, breakdown.risk_adjusted < 50, 'Risco ou eficiencia de preco reduzem a atratividade.')
  addReason(bestFitReasons, factors.pedestrianTraffic >= 75 && (config.factorWeights.pedestrianTraffic ?? 0) > 0, 'Bom potencial de fluxo de pedestres.')
  addReason(bestFitReasons, factors.roadAccess >= 75 && (config.factorWeights.roadAccess ?? 0) > 0, 'Acesso viario favorece operacao logistica.')
  addReason(bestFitReasons, factors.lowCompetition >= 75 && ((config.factorWeights.lowCompetition ?? 0) > 0 || (config.factorWeights.lowDirectCompetition ?? 0) > 0), 'Baixa concorrencia direta no entorno mapeado.')
  addReason(bestFitReasons, factors.complementaryBusinesses >= 75 && (config.factorWeights.complementaryBusinesses ?? 0) > 0, 'Negocios complementares aumentam o encaixe comercial.')
  addReason(bestFitReasons, factors.stableCommerce >= 75 && (config.factorWeights.stableCommerce ?? 0) > 0, 'Sinais de comercio estavel reduzem risco de vacancia.')
  addReason(bestFitReasons, factors.residentialDensity >= 75 && (config.factorWeights.residentialDensity ?? 0) > 0, 'Densidade residencial sustenta demanda recorrente.')

  return {
    strategy: strategySlug,
    score,
    confidence: confidenceFor(missingData, insightConfidence),
    breakdown,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    best_fit_reasons: bestFitReasons.slice(0, 4),
    missing_data: Array.from(new Set(missingData)),
  }
}
