import type { LocationInsightPersisted } from '@/lib/schemas/location-insight'
import type { Database } from '@/types/supabase'
import {
  ScoreResultSchema,
  type CategoryBreakdown,
  type ScoreRisk,
  type ScoreSignal,
  type ScoringOutcome,
} from './schemas'
import { getStrategy, type StrategyProfile } from './strategies'

type ListingRow = Database['public']['Tables']['listings']['Row']

export interface ScoringEngine {
  computeScore(
    listing: ListingRow | null | undefined,
    insight: LocationInsightPersisted | null | undefined,
    profile: StrategyProfile
  ): ScoringOutcome
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function categoryMatches(category: string, terms: string[]): boolean {
  if (terms.length === 0) return false
  const norm = category.toLowerCase()
  return terms.some((t) => norm.includes(t.toLowerCase()))
}

// ---------------------------------------------------------------------------
// Category: Demographics Fit
// ---------------------------------------------------------------------------
export function scoreDemographics(
  insight: LocationInsightPersisted,
  _profile: StrategyProfile
): CategoryBreakdown {
  const signals: ScoreSignal[] = []
  const risks: ScoreRisk[] = []

  const income = insight.avgIncome ?? null
  const density = insight.populationDensity ?? null

  let score = 50

  if (income === null || income === undefined) {
    score = 40
    risks.push({ category: 'demographics', label: 'Renda média não disponível', severity: 'medium' })
  } else if (income < 1500) {
    score = 20
    signals.push({ category: 'demographics', label: 'Renda per capita baixa na área', impact: 'negative', value: income })
  } else if (income < 2500) {
    score = 45
    signals.push({ category: 'demographics', label: 'Renda per capita moderada-baixa', impact: 'neutral', value: income })
  } else if (income < 4000) {
    score = 65
    signals.push({ category: 'demographics', label: 'Renda per capita moderada na área', impact: 'neutral', value: income })
  } else if (income < 7000) {
    score = 85
    signals.push({ category: 'demographics', label: 'Renda per capita alta na área', impact: 'positive', value: income })
  } else {
    score = 95
    signals.push({ category: 'demographics', label: 'Renda per capita muito alta na área', impact: 'positive', value: income })
  }

  if (density !== null && density !== undefined) {
    if (density > 5000) {
      score = Math.min(100, score + 5)
      signals.push({ category: 'demographics', label: 'Alta densidade populacional', impact: 'positive', value: density })
    } else if (density < 500) {
      score = Math.max(0, score - 10)
      signals.push({ category: 'demographics', label: 'Baixa densidade populacional', impact: 'negative', value: density })
    }
  }

  score = clamp(score)
  const weight = _profile.weights.demographics
  return {
    category: 'demographics',
    label: 'Perfil Demográfico',
    score,
    weight,
    weighted: Math.round(score * weight * 100) / 100,
    signals,
    risks,
  }
}

// ---------------------------------------------------------------------------
// Category: Location Quality
// ---------------------------------------------------------------------------
export function scoreLocationQuality(
  listing: ListingRow,
  insight: LocationInsightPersisted,
  profile: StrategyProfile
): CategoryBreakdown {
  const signals: ScoreSignal[] = []
  const risks: ScoreRisk[] = []

  const confidence = insight.confidenceScore ?? null
  const hasCoords =
    (insight.latitude !== null && insight.latitude !== undefined) ||
    (listing.lat !== null && listing.lat !== undefined)

  let score = 50

  if (confidence === null || confidence === undefined) {
    score = 30
    risks.push({ category: 'location_quality', label: 'Dados de localização incompletos', severity: 'high' })
  } else if (confidence < 40) {
    score = 25
    risks.push({ category: 'location_quality', label: 'Confiança de geocodificação baixa', severity: 'high' })
  } else if (confidence < 60) {
    score = 50
  } else if (confidence < 80) {
    score = 70
    signals.push({ category: 'location_quality', label: 'Localização geocodificada com boa precisão', impact: 'positive', value: confidence })
  } else {
    score = 88
    signals.push({ category: 'location_quality', label: 'Localização verificada com alta confiança', impact: 'positive', value: confidence })
  }

  if (hasCoords) {
    score = Math.min(100, score + 7)
  } else {
    score = Math.max(0, score - 10)
    risks.push({ category: 'location_quality', label: 'Coordenadas geográficas ausentes', severity: 'medium' })
  }

  score = clamp(score)
  const weight = profile.weights.locationQuality
  return {
    category: 'location_quality',
    label: 'Qualidade da Localização',
    score,
    weight,
    weighted: Math.round(score * weight * 100) / 100,
    signals,
    risks,
  }
}

// ---------------------------------------------------------------------------
// Category: Nearby Businesses (foot traffic proxy)
// ---------------------------------------------------------------------------
const TRAFFIC_GENERATORS = [
  'transit', 'bus', 'metro', 'subway', 'station', 'terminal',
  'school', 'university', 'college',
  'mall', 'shopping',
  'hospital', 'clinic', 'ubs',
  'supermarket', 'supermercado', 'hypermarket',
]

export function scoreNearbyBusinesses(
  insight: LocationInsightPersisted,
  profile: StrategyProfile
): CategoryBreakdown {
  const signals: ScoreSignal[] = []
  const risks: ScoreRisk[] = []

  const nearby = insight.nearbyBusinesses ?? []

  if (nearby.length === 0) {
    risks.push({ category: 'nearby_businesses', label: 'Sem dados de negócios próximos', severity: 'medium' })
    const weight = profile.weights.nearbyBusinesses
    return {
      category: 'nearby_businesses',
      label: 'Negócios Próximos',
      score: 20,
      weight,
      weighted: Math.round(20 * weight * 100) / 100,
      signals,
      risks,
    }
  }

  const within500 = nearby.filter(
    (b) => b.distanceMeters === null || b.distanceMeters === undefined || (b.distanceMeters as number) <= 500
  )

  // Traffic generators
  let trafficBonus = 0
  for (const b of within500) {
    if (categoryMatches(String(b.category ?? ''), TRAFFIC_GENERATORS)) {
      trafficBonus = Math.min(trafficBonus + 8, 32)
    }
  }

  // Affinity matches
  let affinityBonus = 0
  let affinityCount = 0
  for (const b of within500) {
    if (categoryMatches(String(b.category ?? ''), profile.nearbyAffinities)) {
      affinityBonus = Math.min(affinityBonus + 10, 30)
      affinityCount++
    }
  }

  const score = clamp(30 + trafficBonus + affinityBonus)

  if (affinityCount >= 2) {
    signals.push({ category: 'nearby_businesses', label: 'Negócios complementares próximos', impact: 'positive', value: affinityCount })
  }
  if (trafficBonus >= 16) {
    signals.push({ category: 'nearby_businesses', label: 'Alta geração de fluxo de pedestres', impact: 'positive' })
  }

  const weight = profile.weights.nearbyBusinesses
  return {
    category: 'nearby_businesses',
    label: 'Negócios Próximos',
    score,
    weight,
    weighted: Math.round(score * weight * 100) / 100,
    signals,
    risks,
  }
}

// ---------------------------------------------------------------------------
// Category: Competition
// ---------------------------------------------------------------------------
export function scoreCompetition(
  insight: LocationInsightPersisted,
  profile: StrategyProfile
): CategoryBreakdown {
  const signals: ScoreSignal[] = []
  const risks: ScoreRisk[] = []

  const nearby = insight.nearbyBusinesses ?? []

  // Strategies with no conflicts (logistics, services) have low competitive pressure by definition
  if (profile.nearbyConflicts.length === 0) {
    signals.push({ category: 'competition', label: 'Perfil com baixa pressão competitiva', impact: 'positive' })
    const weight = profile.weights.competition
    return {
      category: 'competition',
      label: 'Concorrência',
      score: 75,
      weight,
      weighted: Math.round(75 * weight * 100) / 100,
      signals,
      risks,
    }
  }

  const competitors500 = nearby.filter(
    (b) =>
      categoryMatches(String(b.category ?? ''), profile.nearbyConflicts) &&
      (b.distanceMeters === null || b.distanceMeters === undefined || (b.distanceMeters as number) <= 500)
  )
  const competitors1000 = nearby.filter(
    (b) =>
      categoryMatches(String(b.category ?? ''), profile.nearbyConflicts) &&
      (b.distanceMeters === null || b.distanceMeters === undefined || (b.distanceMeters as number) <= 1000)
  )

  let score: number
  if (competitors500.length === 0) {
    score = 90
    signals.push({ category: 'competition', label: 'Sem concorrentes diretos em 500m', impact: 'positive' })
  } else if (competitors500.length <= 2) {
    score = 70
    signals.push({ category: 'competition', label: 'Concorrência baixa a moderada na área', impact: 'neutral', value: competitors500.length })
  } else if (competitors500.length <= 5) {
    score = 45
    risks.push({ category: 'competition', label: 'Concorrência moderada na área', severity: 'medium' })
  } else {
    score = 20
    risks.push({ category: 'competition', label: 'Alta concorrência direta na área', severity: 'high' })
  }

  if (competitors1000.length > 8) {
    risks.push({ category: 'competition', label: 'Mercado saturado na região', severity: 'medium' })
  }

  score = clamp(score)
  const weight = profile.weights.competition
  return {
    category: 'competition',
    label: 'Concorrência',
    score,
    weight,
    weighted: Math.round(score * weight * 100) / 100,
    signals,
    risks,
  }
}

// ---------------------------------------------------------------------------
// Category: Risk
// ---------------------------------------------------------------------------
export function scoreRisk(
  listing: ListingRow,
  insight: LocationInsightPersisted,
  _profile: StrategyProfile
): CategoryBreakdown {
  const signals: ScoreSignal[] = []
  const risks: ScoreRisk[] = []

  let score = 70

  const confidence = insight.confidenceScore ?? null
  const income = insight.avgIncome ?? null
  const nearby = insight.nearbyBusinesses ?? []

  if (confidence !== null && confidence < 50) {
    score -= 20
    risks.push({ category: 'risk', label: 'Baixa confiança nos dados de localização', severity: 'high' })
  }

  if (income === null || income === undefined) {
    score -= 10
    risks.push({ category: 'risk', label: 'Dados demográficos insuficientes', severity: 'medium' })
  }

  if (nearby.length === 0) {
    score -= 10
    risks.push({ category: 'risk', label: 'Dados de negócios próximos ausentes', severity: 'medium' })
  }

  const allDataPresent = confidence !== null && confidence >= 70 && income !== null && nearby.length > 0
  if (allDataPresent) {
    score += 15
    signals.push({ category: 'risk', label: 'Dados de boa qualidade disponíveis', impact: 'positive' })
  }

  // Listing-level risk signals
  const tags = listing.tags ?? []
  if (tags.includes('distressed') || tags.includes('reforma')) {
    score -= 10
    risks.push({ category: 'risk', label: 'Imóvel com sinais de deterioração ou necessidade de reforma', severity: 'medium' })
  }

  score = clamp(score)
  const weight = _profile.weights.risk
  return {
    category: 'risk',
    label: 'Risco',
    score,
    weight,
    weighted: Math.round(score * weight * 100) / 100,
    signals,
    risks,
  }
}

// ---------------------------------------------------------------------------
// Category: Investor Fit
// ---------------------------------------------------------------------------
export function scoreInvestorFit(
  listing: ListingRow,
  _profile: StrategyProfile
): CategoryBreakdown {
  const signals: ScoreSignal[] = []
  const risks: ScoreRisk[] = []

  const price = listing.price_amount ?? null
  const tags = listing.tags ?? []

  let score = 50

  if (price !== null) {
    if (price < 150000) {
      score = 60
      signals.push({ category: 'investor_fit', label: 'Faixa de preço para investidor oportunístico', impact: 'neutral', value: price })
    } else if (price < 500000) {
      score = 70
      signals.push({ category: 'investor_fit', label: 'Faixa de preço para value-add', impact: 'positive', value: price })
    } else if (price < 2000000) {
      score = 80
      signals.push({ category: 'investor_fit', label: 'Faixa de preço institucional', impact: 'positive', value: price })
    } else {
      score = 85
      signals.push({ category: 'investor_fit', label: 'Ativo de alto valor — perfil core', impact: 'positive', value: price })
    }
  }

  if (tags.includes('distressed') || tags.includes('reforma')) {
    score = Math.max(0, score - 10)
  }
  if (tags.includes('leased') || tags.includes('locado')) {
    score = Math.min(100, score + 10)
    signals.push({ category: 'investor_fit', label: 'Imóvel locado — fluxo de renda imediato', impact: 'positive' })
  }

  score = clamp(score)
  const weight = _profile.weights.investorFit
  return {
    category: 'investor_fit',
    label: 'Perfil de Investidor',
    score,
    weight,
    weighted: Math.round(score * weight * 100) / 100,
    signals,
    risks,
  }
}

// ---------------------------------------------------------------------------
// Composition: computeScore
// ---------------------------------------------------------------------------
function deriveFitLabel(total: number): 'forte' | 'moderado' | 'fraco' {
  if (total >= 70) return 'forte'
  if (total >= 50) return 'moderado'
  return 'fraco'
}

function topSignals(breakdown: CategoryBreakdown[], limit = 5): ScoreSignal[] {
  // Collect positive signals, ordered by the weight of their category (higher weight = more relevant)
  const withWeight: Array<{ signal: ScoreSignal; weight: number }> = []
  for (const cat of breakdown) {
    for (const signal of cat.signals) {
      if (signal.impact === 'positive') {
        withWeight.push({ signal, weight: cat.weight })
      }
    }
  }
  withWeight.sort((a, b) => b.weight - a.weight)
  return withWeight.slice(0, limit).map((x) => x.signal)
}

function topRisks(breakdown: CategoryBreakdown[], limit = 3): ScoreRisk[] {
  const severityOrder = { high: 0, medium: 1, low: 2 }
  const all: ScoreRisk[] = breakdown.flatMap((cat) => cat.risks)
  all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  return all.slice(0, limit)
}

export function computeScore(
  listing: ListingRow | null | undefined,
  insight: LocationInsightPersisted | null | undefined,
  strategySlugOrProfile: string | StrategyProfile
): ScoringOutcome {
  if (!insight) {
    return { status: 'NEEDS_ENRICHMENT', message: 'Enriqueça a localização antes de calcular a pontuação.' }
  }
  if (!listing) {
    return { status: 'ENRICHMENT_FAILED', message: 'Imóvel não encontrado para calcular a pontuação.' }
  }

  const profile =
    typeof strategySlugOrProfile === 'string'
      ? getStrategy(strategySlugOrProfile)
      : strategySlugOrProfile

  const demoCat = scoreDemographics(insight, profile)
  const locCat = scoreLocationQuality(listing, insight, profile)
  const nearbyCat = scoreNearbyBusinesses(insight, profile)
  const compCat = scoreCompetition(insight, profile)
  const riskCat = scoreRisk(listing, insight, profile)
  const investorCat = scoreInvestorFit(listing, profile)

  const breakdown: CategoryBreakdown[] = [
    demoCat,
    locCat,
    nearbyCat,
    compCat,
    riskCat,
    investorCat,
  ]

  const rawTotal = breakdown.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  const totalScore = clamp(Math.round(rawTotal))

  const result = ScoreResultSchema.parse({
    totalScore,
    breakdown,
    signals: topSignals(breakdown),
    risks: topRisks(breakdown),
    fitLabel: deriveFitLabel(totalScore),
    strategySlug: profile.slug,
    computedAt: new Date().toISOString(),
  })

  return { status: 'SCORED', result }
}

export const calculateUniversalScore = computeScore

// ---------------------------------------------------------------------------
// RuleBasedScoringEngine class
// ---------------------------------------------------------------------------
export class RuleBasedScoringEngine implements ScoringEngine {
  computeScore(
    listing: ListingRow | null | undefined,
    insight: LocationInsightPersisted | null | undefined,
    profile: StrategyProfile
  ): ScoringOutcome {
    return computeScore(listing, insight, profile)
  }
}
