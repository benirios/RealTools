import type { Database } from '@/types/supabase'
import type { CategoryBreakdown, ScoreResult } from './schemas'

export type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']

export type ScoreCardEntry = {
  result: ScoreResult
  scoreVersion?: number
}

export type ScoreBand = {
  label: 'Forte' | 'Moderado' | 'Baixo' | 'Fraco'
  color: '#22c55e' | '#eab308' | '#f97316' | '#ff6868'
}

export type CategoryRow = {
  key: 'demographics' | 'locationQuality' | 'nearbyBusinesses' | 'competition' | 'risk'
  label: string
  score: number
  weight: number
  weighted: number
}

export const SCORE_CARD_COPY = {
  eyebrow: 'Pontuação de oportunidade',
  heading: 'Score por estratégia',
  primaryCta: 'Calcular pontuação',
  recomputeCta: 'Recalcular pontuação',
  loading: 'Calculando...',
  emptyHeading: 'Pontuação de oportunidade',
  emptyBody: 'Escolha uma estratégia e calcule a atratividade deste imóvel para ver o score e os principais sinais.',
  missingEnrichment: 'Enriqueça a localização antes de calcular a pontuação',
  missingEnrichmentNextStep: 'Use o enriquecimento de localização para gerar o contexto da área e então calcular o score.',
  errorFallback: 'Não foi possível calcular a pontuação. Revise o enriquecimento da localização e tente novamente.',
  signalsTitle: 'Pontos fortes',
  risksTitle: 'Riscos',
} as const

export const CATEGORY_ROWS: CategoryRow[] = [
  { key: 'demographics', label: 'Demografia', score: 0, weight: 0, weighted: 0 },
  { key: 'locationQuality', label: 'Qualidade da localização', score: 0, weight: 0, weighted: 0 },
  { key: 'nearbyBusinesses', label: 'Fluxo potencial', score: 0, weight: 0, weighted: 0 },
  { key: 'competition', label: 'Concorrência', score: 0, weight: 0, weighted: 0 },
  { key: 'risk', label: 'Risco', score: 0, weight: 0, weighted: 0 },
]

type RawBreakdown = Partial<CategoryBreakdown> & {
  category?: string
  key?: string
  score?: number
  weight?: number
  weighted?: number
}

const CATEGORY_ALIASES: Record<string, CategoryRow['key']> = {
  demographics: 'demographics',
  demographic: 'demographics',
  location_quality: 'locationQuality',
  locationQuality: 'locationQuality',
  location: 'locationQuality',
  nearby_businesses: 'nearbyBusinesses',
  nearbyBusinesses: 'nearbyBusinesses',
  foot_traffic: 'nearbyBusinesses',
  footTraffic: 'nearbyBusinesses',
  competition: 'competition',
  risk: 'risk',
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function normalizeCategoryKey(category: string | undefined): CategoryRow['key'] | null {
  if (!category) return null
  return CATEGORY_ALIASES[category] ?? null
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 70) return { label: 'Forte', color: '#22c55e' }
  if (score >= 50) return { label: 'Moderado', color: '#eab308' }
  if (score >= 40) return { label: 'Baixo', color: '#f97316' }
  return { label: 'Fraco', color: '#ff6868' }
}

export function getFitLabelText(fitLabel: ScoreResult['fitLabel'] | string): string {
  if (fitLabel === 'forte') return 'Forte'
  if (fitLabel === 'moderado') return 'Moderado'
  return 'Fraco'
}

export function getCategoryRows(breakdown: RawBreakdown[] = []): CategoryRow[] {
  const byKey = new Map<CategoryRow['key'], RawBreakdown>()

  for (const item of breakdown) {
    const key = normalizeCategoryKey(item.category ?? item.key)
    if (key && !byKey.has(key)) byKey.set(key, item)
  }

  return CATEGORY_ROWS.map((base) => {
    const item = byKey.get(base.key)
    return {
      ...base,
      score: clampScore(item?.score),
      weight: typeof item?.weight === 'number' ? item.weight : base.weight,
      weighted: typeof item?.weighted === 'number' ? item.weighted : base.weighted,
    }
  })
}

function asBreakdown(value: unknown): CategoryBreakdown[] {
  return Array.isArray(value) ? (value as CategoryBreakdown[]) : []
}

function asSignals(value: unknown): ScoreResult['signals'] {
  return Array.isArray(value) ? (value as ScoreResult['signals']) : []
}

function asRisks(value: unknown): ScoreResult['risks'] {
  return Array.isArray(value) ? (value as ScoreResult['risks']) : []
}

export function scoreRowToCardEntry(row: OpportunityScoreRow): ScoreCardEntry {
  return {
    scoreVersion: row.score_version ?? undefined,
    result: {
      totalScore: clampScore(row.total_score),
      strategySlug: row.strategy_slug ?? 'any',
      fitLabel: (row.fit_label ?? 'fraco') as ScoreResult['fitLabel'],
      breakdown: asBreakdown(row.breakdown),
      signals: asSignals(row.signals),
      risks: asRisks(row.risks),
      computedAt: row.computed_at ?? row.updated_at ?? '',
    },
  }
}
