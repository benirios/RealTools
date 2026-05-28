'use client'

import type { JSX } from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StrategySelector } from '@/components/listings/strategy-selector'
import { scoreListingAction } from '@/lib/actions/scoring-actions'
import { STRATEGIES, type StrategySlug } from '@/lib/scoring/strategies'
import {
  SCORE_CARD_COPY,
  getCategoryRows,
  getFitLabelText,
  getScoreBand,
  type ScoreCardEntry,
} from '@/lib/scoring/score-card-ui'
import type { ScoreResult } from '@/lib/scoring/schemas'

type OpportunityScoreCardProps = {
  listingId: string
  locationInsightAvailable: boolean
  initialScores: ScoreCardEntry[]
}

function scoreEntryForStrategy(entries: ScoreCardEntry[], strategySlug: StrategySlug) {
  return entries.find((entry) => entry.result.strategySlug === strategySlug) ?? null
}

function makeActionEntry(result: ScoreResult): ScoreCardEntry {
  return { result }
}

function upsertEntry(entries: ScoreCardEntry[], nextEntry: ScoreCardEntry) {
  const withoutCurrent = entries.filter(
    (entry) => entry.result.strategySlug !== nextEntry.result.strategySlug
  )
  return [nextEntry, ...withoutCurrent]
}

function ScoreRing({ score }: { score: number }) {
  const band = getScoreBand(score)

  return (
    <div
      className="grid size-[112px] shrink-0 place-items-center rounded-full sm:size-32"
      style={{
        background: `conic-gradient(${band.color} ${score * 3.6}deg, hsl(var(--muted)) 0deg)`,
      }}
    >
      <div className="grid size-[92px] place-items-center rounded-full border border-border bg-card sm:size-[104px]">
        <div className="text-center">
          <p className="text-[2rem] font-semibold leading-none text-foreground sm:text-[2.35rem]">
            {score}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{band.label}</p>
        </div>
      </div>
    </div>
  )
}

function CategoryBars({ score }: { score: ScoreResult }) {
  const rows = getCategoryRows(score.breakdown)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critérios</p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">{row.score}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${row.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalRiskLists({ score }: { score: ScoreResult }) {
  const signals = score.signals.slice(0, 3)
  const risks = score.risks.slice(0, 3)

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
          {SCORE_CARD_COPY.signalsTitle}
        </p>
        {signals.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {signals.map((signal, index) => (
              <li key={`${signal.category}-${signal.label}-${index}`}>{signal.label}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sem sinais fortes registrados.</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-orange-400">
          {SCORE_CARD_COPY.risksTitle}
        </p>
        {risks.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {risks.map((risk, index) => (
              <li key={`${risk.category}-${risk.label}-${index}`}>{risk.label}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sem riscos principais registrados.</p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ hasLocationInsight }: { hasLocationInsight: boolean }) {
  if (!hasLocationInsight) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">{SCORE_CARD_COPY.missingEnrichment}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {SCORE_CARD_COPY.missingEnrichmentNextStep}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">{SCORE_CARD_COPY.emptyHeading}</p>
      <p className="mt-1 text-sm text-muted-foreground">{SCORE_CARD_COPY.emptyBody}</p>
    </div>
  )
}

export function OpportunityScoreCard({
  listingId,
  locationInsightAvailable,
  initialScores,
}: OpportunityScoreCardProps): JSX.Element {
  const router = useRouter()
  const [selectedStrategy, setSelectedStrategy] = useState<StrategySlug>(
    (initialScores[0]?.result.strategySlug as StrategySlug | undefined) ?? 'cafe'
  )
  const [scores, setScores] = useState<ScoreCardEntry[]>(initialScores)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const currentScore = scoreEntryForStrategy(scores, selectedStrategy)
  const ctaLabel = currentScore ? SCORE_CARD_COPY.recomputeCta : SCORE_CARD_COPY.primaryCta

  const handleScore = () => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await scoreListingAction(listingId, selectedStrategy)

      if (result.errors?.general?.[0]) {
        setError(result.errors.general[0])
        return
      }

      if (result.score) {
        setScores((current) => upsertEntry(current, makeActionEntry(result.score!)))
        setMessage(result.message ?? null)
        router.refresh()
      }
    })
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {SCORE_CARD_COPY.eyebrow}
          </p>
          <h2 className="text-lg font-semibold text-foreground">{SCORE_CARD_COPY.heading}</h2>
        </div>

        <div className="grid gap-3 sm:min-w-[360px] sm:grid-cols-[1fr_auto] sm:items-end">
          <StrategySelector
            value={selectedStrategy}
            onValueChange={setSelectedStrategy}
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !locationInsightAvailable}
            onClick={handleScore}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {isPending ? SCORE_CARD_COPY.loading : ctaLabel}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-500">{message}</p>}

      {currentScore ? (
        <div className="grid gap-5 rounded-md border border-border bg-background/40 p-4 lg:grid-cols-[auto_1fr]">
          <div className="space-y-3">
            <ScoreRing score={currentScore.result.totalScore} />
            <div className="space-y-2">
              <Badge variant="secondary">{STRATEGIES[selectedStrategy].label}</Badge>
              <Badge variant="outline">{getFitLabelText(currentScore.result.fitLabel)}</Badge>
              {currentScore.scoreVersion ? (
                <Badge variant="outline">Versão {currentScore.scoreVersion}</Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-5">
            <CategoryBars score={currentScore.result} />
            <SignalRiskLists score={currentScore.result} />
          </div>
        </div>
      ) : (
        <EmptyState hasLocationInsight={locationInsightAvailable} />
      )}
    </section>
  )
}
