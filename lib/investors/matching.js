const MATCH_SCORE_WEIGHTS = {
  budget_fit: 0.18,
  location_fit: 0.16,
  property_type_fit: 0.12,
  strategy_fit: 0.16,
  risk_fit: 0.12,
  tag_fit: 0.08,
  opportunity_quality: 0.18,
}

const STRATEGY_ALIASES = {
  own_business: 'retail',
  retail: 'retail',
  rental_income: 'rental_income',
  food_beverage: 'food_beverage',
  cafe: 'food_beverage',
  restaurant: 'food_beverage',
  pharmacy: 'pharmacy',
  logistics: 'warehouse_logistics',
  warehouse_logistics: 'warehouse_logistics',
  gym_fitness: 'gym_fitness',
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeArray(values) {
  if (!Array.isArray(values)) return []
  return values.map(normalize).filter(Boolean)
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(String(value).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function hasAnyPreference(values) {
  const normalized = normalizeArray(values)
  return normalized.length === 0 || normalized.includes('any') || normalized.includes('qualquer')
}

function statusForScore(score) {
  if (score >= 75) return 'strong'
  if (score >= 45) return 'medium'
  return 'weak'
}

function preferredStrategy(investor) {
  const strategy = normalize(investor.strategy ?? investor.preferred_strategy ?? investor.preferredStrategy)
  if (!strategy || strategy === 'any' || strategy === 'qualquer') return ''
  return STRATEGY_ALIASES[strategy] ?? strategy
}

function scoreBudget(investor, point, strengths, concerns, missingData) {
  const min = toNumber(investor.budget_min ?? investor.budgetMin)
  const max = toNumber(investor.budget_max ?? investor.budgetMax)
  const price = toNumber(point.price_amount ?? point.price ?? point.priceText)

  if (price === undefined) {
    missingData.push('price_amount')
    concerns.push('Point price is missing, so budget fit is less certain.')
    return 55
  }

  if (min === undefined && max === undefined) {
    strengths.push('Investor has flexible budget preferences.')
    return 75
  }

  if ((min === undefined || price >= min) && (max === undefined || price <= max)) {
    strengths.push('Price fits the investor budget range.')
    return 100
  }

  if (max !== undefined && price > max && price <= max * 1.15) {
    concerns.push('Price is slightly above budget but within 15% tolerance.')
    return 55
  }

  if (min !== undefined && price < min) {
    concerns.push('Price is below the investor target range.')
    return 65
  }

  concerns.push('Price is outside the investor budget range.')
  return 15
}

function scoreLocation(investor, point, strengths, concerns) {
  const preferences = normalizeArray(
    investor.preferred_neighborhoods ??
    investor.preferredNeighborhoods ??
    investor.preferred_locations ??
    investor.preferredLocations
  )
  if (hasAnyPreference(preferences)) {
    strengths.push('Investor is flexible on location.')
    return 75
  }

  const location = [
    point.neighborhood,
    point.location_text,
    point.locationText,
    point.address_text,
    point.address,
    point.city,
    point.state,
    point.region,
  ].map(normalize).filter(Boolean).join(' ')

  const match = preferences.find((preference) => location.includes(preference))
  if (match) {
    strengths.push('Point is in a preferred location.')
    return 100
  }

  concerns.push('Location does not match the investor preferred areas.')
  return 25
}

function scorePropertyType(investor, point, strengths, concerns) {
  const preferences = normalizeArray(investor.property_types ?? investor.propertyTypes)
  if (hasAnyPreference(preferences)) {
    strengths.push('Investor is flexible on property type.')
    return 75
  }

  const propertyType = normalize(point.property_type ?? point.propertyType ?? point.commercial_type ?? point.commercialType)
  if (propertyType && preferences.some((preference) => propertyType.includes(preference) || preference.includes(propertyType))) {
    strengths.push(`Property type matches preference: ${propertyType}.`)
    return 100
  }

  concerns.push('Property type does not match the investor preference.')
  return 25
}

function getStrategyFitScore(point, strategy) {
  if (!strategy) return undefined

  const direct = point.strategy_fit_score ?? point.strategyFitScore
  if (direct && normalize(direct.strategy) === strategy) return toNumber(direct.score)

  const scores = point.strategy_fit_scores ?? point.strategyFitScores
  if (Array.isArray(scores)) {
    const match = scores.find((score) => normalize(score.strategy) === strategy)
    return match ? toNumber(match.score) : undefined
  }

  if (scores && typeof scores === 'object') {
    const score = scores[strategy]
    if (typeof score === 'number') return score
    if (score && typeof score === 'object') return toNumber(score.score)
  }

  return undefined
}

function scoreStrategy(investor, point, strengths, concerns, missingData) {
  const strategy = preferredStrategy(investor)
  if (!strategy) {
    strengths.push('Investor is open to any strategy.')
    return 75
  }

  const persistedFitScore = getStrategyFitScore(point, strategy)
  if (persistedFitScore !== undefined) {
    if (persistedFitScore >= 75) strengths.push('Point has strong strategy fit for the investor thesis.')
    else if (persistedFitScore < 50) concerns.push('Strategy fit score is weak for the investor thesis.')
    return clamp(persistedFitScore)
  }

  missingData.push('strategy_fit_score')
  const pointTags = normalizeArray(point.tags)
  const description = normalize(point.description)
  const signals = {
    retail: ['retail', 'loja', 'ponto comercial', 'street_front', 'vitrine'],
    rental_income: ['rental_income', 'renda', 'aluguel', 'locado', 'leased', 'high_yield'],
    food_beverage: ['food', 'restaurant', 'cafe', 'alimentacao', 'lanchonete', 'bar'],
    pharmacy: ['pharmacy', 'farmacia', 'drogaria', 'health'],
    warehouse_logistics: ['warehouse', 'galpao', 'logistica', 'industrial', 'rodovia'],
    gym_fitness: ['gym', 'academia', 'fitness', 'health'],
  }[strategy] ?? []

  const matched = signals.some((signal) => pointTags.includes(signal) || description.includes(signal))
  if (matched) {
    strengths.push('Listing tags or description match the investor strategy.')
    return 72
  }

  concerns.push('No persisted strategy fit score is available for the investor thesis.')
  return 45
}

function scoreRisk(investor, point, strengths, concerns, missingData) {
  const risk = normalize(investor.risk_level ?? investor.riskLevel)
  if (!risk || risk === 'any' || risk === 'qualquer') {
    strengths.push('Investor is flexible on risk level.')
    return 75
  }

  const pointTags = normalizeArray(point.tags)
  const confidence = toNumber(point.confidence ?? point.commercial_confidence_score ?? point.commercialConfidenceScore)
  if (confidence === undefined) missingData.push('commercial_confidence_score')

  const stable = pointTags.includes('stable') || pointTags.includes('leased') || pointTags.includes('locado') || (confidence ?? 0) >= 80
  const highRisk = pointTags.includes('high_risk') || pointTags.includes('distressed') || pointTags.includes('reforma') || pointTags.includes('flip')

  if (risk === 'low') {
    if (stable && !highRisk) {
      strengths.push('Risk profile fits a conservative investor.')
      return 92
    }
    concerns.push('Risk signals may be high for this investor.')
    return 35
  }

  if (risk === 'medium') {
    if (!highRisk) {
      strengths.push('Risk profile fits a medium-risk mandate.')
      return 85
    }
    concerns.push('Point has high-risk signals for a medium-risk investor.')
    return 50
  }

  if (risk === 'high') {
    if (highRisk) {
      strengths.push('Risk profile fits an opportunistic investor.')
      return 92
    }
    return 70
  }

  return 65
}

function scoreTags(investor, point, strengths) {
  const investorTags = normalizeArray(investor.tags)
  const pointTags = normalizeArray(point.tags)
  if (investorTags.length === 0) return 70

  const shared = investorTags.filter((tag) => pointTags.includes(tag))
  if (shared.length === 0) return 20

  strengths.push(`Shared tags: ${shared.join(', ')}.`)
  return clamp((shared.length / investorTags.length) * 100)
}

function localIntelligenceScore(point, strengths, missingData) {
  const insight = point.location_insight ?? point.locationInsight ?? point.insight ?? {}
  const confidence = toNumber(insight.confidence_score ?? insight.confidenceScore)
  const avgIncome = toNumber(insight.avg_income ?? insight.avgIncome)
  const populationDensity = toNumber(insight.population_density ?? insight.populationDensity)
  const nearbyBusinesses = Array.isArray(insight.nearby_businesses)
    ? insight.nearby_businesses
    : Array.isArray(insight.nearbyBusinesses)
      ? insight.nearbyBusinesses
      : []

  if (
    confidence === undefined &&
    avgIncome === undefined &&
    populationDensity === undefined &&
    nearbyBusinesses.length === 0
  ) {
    missingData.push('location_insight')
    return 55
  }

  let score = 35
  if ((confidence ?? 0) >= 75) score += 20
  else if ((confidence ?? 0) >= 50) score += 12
  if ((avgIncome ?? 0) >= 5000) score += 15
  else if ((avgIncome ?? 0) >= 3000) score += 9
  if ((populationDensity ?? 0) >= 6000) score += 15
  else if ((populationDensity ?? 0) >= 3000) score += 8
  if (nearbyBusinesses.length >= 5) score += 15
  else if (nearbyBusinesses.length >= 2) score += 8

  const finalScore = clamp(score)
  if (finalScore >= 75) strengths.push('Local intelligence shows strong demographic and business signals.')
  return finalScore
}

function scoreOpportunityQuality(_investor, point, strengths, concerns, missingData) {
  const opportunityScore = toNumber(
    point.opportunity_score ??
    point.opportunityScore ??
    point.total_score ??
    point.totalScore
  )
  const localScore = localIntelligenceScore(point, strengths, missingData)

  if (opportunityScore === undefined) {
    missingData.push('universal_opportunity_score')
    concerns.push('Universal opportunity score is missing.')
    return clamp(localScore * 0.5 + 55 * 0.5)
  }

  if (opportunityScore >= 75) strengths.push('Universal opportunity score is strong.')
  else if (opportunityScore < 45) concerns.push('Universal opportunity score is weak.')

  return clamp(opportunityScore * 0.7 + localScore * 0.3)
}

function confidenceFor(missingData, breakdown) {
  const weakSignals = Object.values(breakdown).filter((score) => score < 45).length
  if (missingData.length >= 4) return 'low'
  if (missingData.length >= 2 || weakSignals >= 3) return 'medium'
  return 'high'
}

function generateScoreExplanation(scoreBreakdown) {
  const entries = Object.entries(scoreBreakdown)
  const strongest = entries.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key.replace(/_/g, ' '))
  return `Match is driven by ${strongest.join(' and ')}.`
}

function recommendedAction(matchScore, confidence, concerns) {
  if (matchScore >= 80 && confidence !== 'low') return 'Prioritize outreach and prepare the opportunity memo.'
  if (matchScore >= 60) return 'Review the concerns, then consider sending to the investor.'
  if (concerns.length > 0) return 'Hold for now unless the investor confirms flexibility on the concerns.'
  return 'Keep as a low-priority backup match.'
}

function calculateInvestorMatchScore(point, investor) {
  const strengths = []
  const concerns = []
  const missingData = []
  const breakdown = {
    budget_fit: scoreBudget(investor, point, strengths, concerns, missingData),
    location_fit: scoreLocation(investor, point, strengths, concerns),
    property_type_fit: scorePropertyType(investor, point, strengths, concerns),
    strategy_fit: scoreStrategy(investor, point, strengths, concerns, missingData),
    risk_fit: scoreRisk(investor, point, strengths, concerns, missingData),
    tag_fit: scoreTags(investor, point, strengths),
    opportunity_quality: scoreOpportunityQuality(investor, point, strengths, concerns, missingData),
  }

  const matchScore = clamp(Object.entries(MATCH_SCORE_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight,
    0
  ))
  const confidence = confidenceFor(Array.from(new Set(missingData)), breakdown)
  const explanation = `${matchScore}/100 match. ${generateScoreExplanation(breakdown)}`
  const action = recommendedAction(matchScore, confidence, concerns)

  return {
    investor_id: String(investor.id ?? ''),
    point_id: String(point.id ?? point.listing_id ?? ''),
    match_score: matchScore,
    confidence,
    breakdown,
    explanation,
    strengths,
    concerns,
    recommended_action: action,
    match_status: statusForScore(matchScore),
    reasons: strengths.slice(0, 5),
    missing_data: Array.from(new Set(missingData)),
  }
}

function calculateInvestorDealMatch(investor, deal) {
  return calculateInvestorMatchScore(deal, investor)
}

function rankInvestorDeals(investor, deals) {
  return deals
    .map((deal) => ({
      deal,
      ...calculateInvestorMatchScore(deal, investor),
    }))
    .sort((a, b) => b.match_score - a.match_score)
}

module.exports = {
  MATCH_SCORE_WEIGHTS,
  SCORE_WEIGHTS: MATCH_SCORE_WEIGHTS,
  calculateInvestorMatchScore,
  calculateInvestorDealMatch,
  generateScoreExplanation,
  rankInvestorDeals,
}
