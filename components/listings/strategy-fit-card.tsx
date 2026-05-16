'use client'

import { useMemo, useState, useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { recalculateListingStrategyScoresAction } from '@/lib/actions/location-insight-actions'
import { STRATEGY_FIT_CONFIG, STRATEGY_FIT_SLUGS, type StrategyFitBreakdown, type StrategyFitSlug } from '@/lib/scoring/strategy-fit'
import type { Database, Json } from '@/types/supabase'

type StrategyFitRow = Database['public']['Tables']['strategy_fit_scores']['Row']

type StrategyFitCardProps = {
  listingId: string
  locationInsightAvailable: boolean
  initialScores: StrategyFitRow[]
}

type DisplayScore = {
  strategy: StrategyFitSlug
  score: number
  confidence: string
  breakdown: StrategyFitBreakdown
  strengths: string[]
  weaknesses: string[]
  bestFitReasons: string[]
  missingData: string[]
}

function jsonArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function scoreFromRow(row: StrategyFitRow): DisplayScore {
  const rawBreakdown = row.breakdown && typeof row.breakdown === 'object' && !Array.isArray(row.breakdown)
    ? row.breakdown as Record<string, unknown>
    : {}

  return {
    strategy: row.strategy as StrategyFitSlug,
    score: row.score,
    confidence: row.confidence,
    breakdown: {
      location: Number(rawBreakdown.location ?? 0),
      demographics: Number(rawBreakdown.demographics ?? 0),
      commercial_activity: Number(rawBreakdown.commercial_activity ?? 0),
      risk_adjusted: Number(rawBreakdown.risk_adjusted ?? 0),
    },
    strengths: jsonArray(row.strengths),
    weaknesses: jsonArray(row.weaknesses),
    bestFitReasons: jsonArray(row.best_fit_reasons),
    missingData: jsonArray(row.missing_data),
  }
}

function ScoreBars({ breakdown }: { breakdown: StrategyFitBreakdown }) {
  const rows = [
    ['Localizacao', breakdown.location],
    ['Demografia', breakdown.demographics],
    ['Atividade comercial', breakdown.commercial_activity],
    ['Ajuste a risco', breakdown.risk_adjusted],
  ] as const

  return (
    <div className="grid gap-2">
      {rows.map(([label, score]) => (
        <div key={label} className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-foreground">{label}</span>
            <span className="tabular-nums text-muted-foreground">{score}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${score}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EvidenceList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/25 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  )
}

export function StrategyFitCard({
  listingId,
  locationInsightAvailable,
  initialScores,
}: StrategyFitCardProps) {
  const router = useRouter()
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyFitSlug>(
    (initialScores[0]?.strategy as StrategyFitSlug | undefined) ?? 'retail'
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scores = useMemo(() => initialScores.map(scoreFromRow), [initialScores])
  const currentScore = scores.find((score) => score.strategy === selectedStrategy) ?? null

  const handleRecalculate = () => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await recalculateListingStrategyScoresAction(listingId)
      if (result.errors?.general?.[0]) {
        setError(result.errors.general[0])
        return
      }
      setMessage(result.message ?? 'Scores recalculados.')
      router.refresh()
    })
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Strategy Fit</p>
          <h2 className="text-lg font-semibold text-foreground">Fit por estrategia</h2>
        </div>
        <div className="grid gap-3 sm:min-w-[360px] sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label>Estrategia</Label>
            <Select
              value={selectedStrategy}
              onValueChange={(value) => setSelectedStrategy(value as StrategyFitSlug)}
              disabled={isPending}
            >
              <SelectTrigger aria-label="Estrategia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_FIT_SLUGS.map((slug) => (
                  <SelectItem key={slug} value={slug}>{STRATEGY_FIT_CONFIG[slug].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !locationInsightAvailable}
            onClick={handleRecalculate}
          >
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            {isPending ? 'Recalculando' : 'Recalcular strategy scores'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      {!locationInsightAvailable ? (
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Enriqueca a localizacao antes de calcular fit por estrategia.
        </div>
      ) : currentScore ? (
        <div className="grid gap-5 rounded-md border border-border bg-background/40 p-4 lg:grid-cols-[auto_1fr]">
          <div className="space-y-3">
            <div className="grid size-[112px] place-items-center rounded-full border border-border bg-card">
              <div className="text-center">
                <p className="text-[2.35rem] font-semibold leading-none text-foreground">{currentScore.score}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">fit</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{STRATEGY_FIT_CONFIG[currentScore.strategy].label}</Badge>
              <Badge variant="outline">Confianca {currentScore.confidence}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <ScoreBars breakdown={currentScore.breakdown} />
            <div className="grid gap-3 md:grid-cols-3">
              <EvidenceList title="Forcas" items={currentScore.strengths} empty="Sem forcas fortes registradas." />
              <EvidenceList title="Fraquezas" items={currentScore.weaknesses} empty="Sem fraquezas principais registradas." />
              <EvidenceList title="Melhor encaixe" items={currentScore.bestFitReasons} empty="Sem razoes de melhor encaixe registradas." />
            </div>
            {currentScore.missingData.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Dados ausentes: {currentScore.missingData.join(', ')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Nenhum score de estrategia salvo ainda. Recalcule para preencher a analise explicavel.
        </div>
      )}
    </section>
  )
}
