import { z } from 'zod'

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return value

  const normalized = value.trim()
  return normalized.length > maxLength
    ? normalized.slice(0, maxLength).trim()
    : normalized
}

function textSchema(maxLength: number) {
  return z.preprocess(
    (value) => normalizeText(value, maxLength),
    z.string().min(1).max(maxLength)
  )
}

function textArraySchema(minItems: number, maxItems: number, maxLength: number) {
  return z.preprocess(
    (value) => {
      if (!Array.isArray(value)) return value

      return value
        .map((item) => normalizeText(item, maxLength))
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
        .slice(0, maxItems)
    },
    z.array(z.string().min(1).max(maxLength)).min(minItems).max(maxItems)
  )
}

export const AiDealSummarySchema = z.object({
  headline: textSchema(180),
  best_fit: textArraySchema(1, 3, 80),
  strengths: textArraySchema(1, 3, 160),
  risks: textArraySchema(1, 2, 160),
  investor_angle: textSchema(360),
  recommended_action: textSchema(260),
  confidence: z.enum(['low', 'medium', 'high']),
})

export type AiDealSummary = z.infer<typeof AiDealSummarySchema>

export type DealSummaryInput = {
  listing: {
    title: string
    address: string | null
    location: string | null
    price: string | number | null
    areaSize: string | number | null
    propertyType: string | null
  }
  opportunityScore: {
    totalScore: number | null
    fitLabel: string | null
    breakdown: unknown
    signals: unknown
    risks: unknown
  }
  demographics: {
    avgIncome: number | null
    populationDensity: number | null
    consumerProfile: string | null
    confidenceScore: number | null
  } | null
  nearbyBusinesses: Array<{
    name: string | null
    category: string | null
    distanceMeters: number | null
  }>
  investorMatches: Array<{
    investorName: string | null
    matchScore: number
    matchStatus: string
    explanation: string
  }>
}
