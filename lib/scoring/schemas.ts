import { z } from 'zod'

export const ScoreSignalSchema = z.object({
  category: z.string(),
  label: z.string(),
  impact: z.enum(['positive', 'neutral', 'negative']),
  value: z.union([z.string(), z.number()]).nullable().optional(),
})

export const ScoreRiskSchema = z.object({
  category: z.string(),
  label: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
})

export const CategoryBreakdownSchema = z.object({
  category: z.string(),
  label: z.string(),
  score: z.number().int().min(0).max(100),
  weight: z.number().min(0).max(1),
  weighted: z.number().min(0).max(100),
  signals: z.array(ScoreSignalSchema).default([]),
  risks: z.array(ScoreRiskSchema).default([]),
})

export const ScoreResultSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  breakdown: z.array(CategoryBreakdownSchema),
  signals: z.array(ScoreSignalSchema),
  risks: z.array(ScoreRiskSchema),
  fitLabel: z.enum(['forte', 'moderado', 'fraco']),
  strategySlug: z.string(),
  computedAt: z.string(),
})

export const StrategyProfileSchema = z.object({
  slug: z.string(),
  label: z.string(),
  weights: z.object({
    demographics: z.number(),
    locationQuality: z.number(),
    nearbyBusinesses: z.number(),
    competition: z.number(),
    risk: z.number(),
    investorFit: z.number(),
  }),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  nearbyAffinities: z.array(z.string()),
  nearbyConflicts: z.array(z.string()),
})

export const ScoringOutcomeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('SCORED'), result: ScoreResultSchema }),
  z.object({ status: z.literal('NEEDS_ENRICHMENT'), message: z.string() }),
  z.object({ status: z.literal('ENRICHMENT_FAILED'), message: z.string() }),
])

export const ScoringActionStateSchema = z.object({
  message: z.string().optional(),
  score: ScoreResultSchema.nullable().optional(),
  errors: z
    .object({
      general: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ScoreSignal = z.infer<typeof ScoreSignalSchema>
export type ScoreRisk = z.infer<typeof ScoreRiskSchema>
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>
export type ScoreResult = z.infer<typeof ScoreResultSchema>
export type ScoringOutcome = z.infer<typeof ScoringOutcomeSchema>
export type StrategyProfile = z.infer<typeof StrategyProfileSchema>
export type ScoringActionState = z.infer<typeof ScoringActionStateSchema>
