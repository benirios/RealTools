/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require('zod')

const ScoreSignalSchema = z.object({
  category: z.string(),
  label: z.string(),
  impact: z.enum(['positive', 'neutral', 'negative']),
  value: z.union([z.string(), z.number()]).nullable().optional(),
})

const ScoreRiskSchema = z.object({
  category: z.string(),
  label: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
})

const CategoryBreakdownSchema = z.object({
  category: z.string(),
  label: z.string(),
  score: z.number().int().min(0).max(100),
  weight: z.number().min(0).max(1),
  weighted: z.number().min(0).max(100),
  signals: z.array(ScoreSignalSchema).default([]),
  risks: z.array(ScoreRiskSchema).default([]),
})

const ScoreResultSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  breakdown: z.array(CategoryBreakdownSchema),
  signals: z.array(ScoreSignalSchema),
  risks: z.array(ScoreRiskSchema),
  fitLabel: z.enum(['forte', 'moderado', 'fraco']),
  strategySlug: z.string(),
  computedAt: z.string(),
})

const StrategyProfileSchema = z.object({
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

const ScoringActionStateSchema = z.object({
  message: z.string().optional(),
  score: ScoreResultSchema.nullable().optional(),
  errors: z
    .object({
      general: z.array(z.string()).optional(),
    })
    .optional(),
})

module.exports = {
  ScoreSignalSchema,
  ScoreRiskSchema,
  CategoryBreakdownSchema,
  ScoreResultSchema,
  StrategyProfileSchema,
  ScoringActionStateSchema,
}
