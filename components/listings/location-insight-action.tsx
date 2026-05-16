'use client'

import { useState, useTransition } from 'react'
import { Database, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enrichListingLocationAction, recalculateListingMatchesAction, recalculateListingStrategyScoresAction, seedDemoLocationInsightsAction } from '@/lib/actions/location-insight-actions'
import type { LocationInsightActionState } from '@/lib/schemas/location-insight'
import { useRouter } from 'next/navigation'

type Props = {
  listingId: string
}

export function LocationInsightAction({ listingId }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [tone, setTone] = useState<'success' | 'error' | null>(null)
  const [enrichPending, startEnrichTransition] = useTransition()
  const [demoPending, startDemoTransition] = useTransition()
  const [matchPending, startMatchTransition] = useTransition()
  const [strategyPending, startStrategyTransition] = useTransition()

  const handleResult = (result: LocationInsightActionState) => {
    if (result.errors?.general?.[0]) {
      setTone('error')
      setMessage(result.errors.general[0])
      return
    }

    if (result.message) {
      setTone('success')
      setMessage(result.message)
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={enrichPending}
          onClick={() => {
            startEnrichTransition(async () => {
              const result = await enrichListingLocationAction(listingId)
              handleResult(result)
            })
          }}
        >
          {enrichPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Reenriquecer ponto
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={matchPending}
          onClick={() => {
            startMatchTransition(async () => {
              const result = await recalculateListingMatchesAction(listingId)
              handleResult(result)
            })
          }}
        >
          {matchPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          Recalcular matches
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={strategyPending}
          onClick={() => {
            startStrategyTransition(async () => {
              const result = await recalculateListingStrategyScoresAction(listingId)
              handleResult(result)
            })
          }}
        >
          {strategyPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          Recalcular strategy scores
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={demoPending}
          onClick={() => {
            startDemoTransition(async () => {
              const result = await seedDemoLocationInsightsAction(listingId)
              handleResult(result)
            })
          }}
        >
          {demoPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Database className="mr-2 size-4" />}
          Criar demo
        </Button>
      </div>

      {message && (
        <p className={tone === 'error' ? 'text-sm text-destructive' : 'text-sm text-emerald-600'}>
          {message}
        </p>
      )}
    </div>
  )
}
